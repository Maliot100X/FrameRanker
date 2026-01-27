import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";

// Cache for tx hashes (in-memory, per serverless instance)
const txHashCache = new Map<string | number, string>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string | number, number>();

/**
 * Get transaction hashes for multiple review IDs in batch
 * Queries Prisma Payment table for purpose: "REVIEW:{reviewId}"
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewIds }: { reviewIds: (number | string)[] } = body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json(
        { error: "reviewIds array is required" },
        { status: 400 }
      );
    }

    // Check cache first
    const now = Date.now();
    const cachedResults: Record<string | number, string> = {};
    const uncachedIds: (number | string)[] = [];

    for (const reviewId of reviewIds) {
      const cached = txHashCache.get(reviewId);
      const timestamp = cacheTimestamps.get(reviewId);

      if (cached && timestamp && now - timestamp < CACHE_DURATION) {
        cachedResults[reviewId] = cached;
      } else {
        uncachedIds.push(reviewId);
      }
    }

    // If all are cached, return immediately
    if (uncachedIds.length === 0) {
      return NextResponse.json(
        { txHashes: cachedResults },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    console.log(
      `[tx-hashes] Fetching payments for ${uncachedIds.length} reviewIds`
    );

    // Fetch payments from Prisma
    // We look for payments where purpose is in the list of "REVIEW:{id}"
    const purposes = uncachedIds.map(id => `REVIEW:${id}`);
    
    const payments = await prisma.payment.findMany({
      where: {
        purpose: {
          in: purposes
        },
        status: {
            // Should we filter by status? Maybe COMPLETED or PENDING?
            // For now, any status is fine as long as it exists.
            not: "FAILED"
        }
      },
      select: {
        txHash: true,
        purpose: true
      }
    });

    const dbResults: Record<string | number, string> = {};

    for (const payment of payments) {
        // Extract reviewId from purpose "REVIEW:{id}"
        const reviewIdStr = payment.purpose.replace("REVIEW:", "");
        // Try to match with original ID type (number or string)
        // If the ID was a number originally, it will be string in purpose.
        // We need to map it back to the requested ID.
        
        // Find matching requested ID
        const matchedId = uncachedIds.find(id => String(id) === reviewIdStr);
        if (matchedId !== undefined) {
            dbResults[matchedId] = payment.txHash;
            
            // Update cache
            txHashCache.set(matchedId, payment.txHash);
            cacheTimestamps.set(matchedId, now);
        }
    }

    return NextResponse.json(
      { txHashes: { ...cachedResults, ...dbResults } },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );

  } catch (error) {
    console.error("[tx-hashes] Error fetching tx hashes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
