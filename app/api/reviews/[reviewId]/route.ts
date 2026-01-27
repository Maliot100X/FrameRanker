import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";

export async function GET(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const reviewId = params.reviewId;

    // Try to parse as Int (legacy ID) or UUID (new ID)
    // For now, we assume UUIDs for new reviews, but if it's an integer, we might need a mapping or just fail if we fully migrated.
    // However, the contract used integer IDs. The DB uses UUID strings.
    // If the frontend requests an integer ID, it might be an old contract review.
    // But since we are "fixing" the app, we can assume we only care about new DB reviews or we need to sync old ones.
    // For simplicity, we will search by ID string.

    const review = await prisma.review.findFirst({
      where: { 
        OR: [
            { id: reviewId },
            // If we had a legacy ID field, we would check it here.
            // For now, let's assume reviewId is the UUID.
        ]
      },
      include: {
        reviewer: true,
        targetUser: true,
      }
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({
      reviewId: review.id,
      reviewer: review.reviewer.walletAddress || "0x...",
      reviewee: review.targetUser?.walletAddress || "0x...",
      reviewerFid: review.reviewer.fid,
      revieweeFid: review.targetUser?.fid,
      reviewerUsername: review.reviewer.username,
      revieweeUsername: review.targetUser?.username,
      content: review.content,
      emoji: review.rating, // Map rating to emoji index if needed, or just use rating
      timestamp: review.createdAt.toISOString(),
    });

  } catch (error: any) {
    console.error("Failed to get review detail:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
