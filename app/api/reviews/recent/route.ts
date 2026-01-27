import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const reviews = await prisma.review.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: true,
        targetUser: true,
      }
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
      emoji: r.rating,
      timestamp: r.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedReviews, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error: any) {
    console.error("Failed to get recent reviews:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
