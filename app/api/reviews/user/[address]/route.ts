import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    // Fetch reviews received by this address
    const reviews = await prisma.review.findMany({
      where: {
        targetUser: {
          walletAddress: {
            equals: address,
            mode: "insensitive", // Case-insensitive
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: true,
        targetUser: true,
      },
      take: 50, // Limit to 50 for now
    });

    const formattedReviews = reviews.map((r) => ({
      reviewId: r.id,
      reviewer: r.reviewer.walletAddress || "0x...",
      reviewee: r.targetUser?.walletAddress || "0x...",
      reviewerFid: r.reviewer.fid,
      revieweeFid: r.targetUser?.fid,
      reviewerUsername: r.reviewer.username,
      revieweeUsername: r.targetUser?.username,
      content: r.content,
      rating: r.rating,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedReviews, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error: any) {
    console.error("Failed to get user reviews:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
