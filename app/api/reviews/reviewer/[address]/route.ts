import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        reviewer: {
          walletAddress: {
            equals: address,
            mode: "insensitive",
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: true,
        targetUser: true,
      },
      take: 50,
    });

    const formattedReviews = reviews.map((r) => ({
      reviewer: r.reviewer.walletAddress as `0x${string}`,
      reviewee: r.targetUser?.walletAddress as `0x${string}`,
      content: r.content,
      emoji: r.rating,
      timestamp: BigInt(Math.floor(r.createdAt.getTime() / 1000)), // Convert to unix timestamp for frontend compatibility
      reviewId: r.id, 
    }));
    
    return NextResponse.json({ reviews: formattedReviews });
  } catch (error) {
    console.error("Error fetching reviews by reviewer:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
