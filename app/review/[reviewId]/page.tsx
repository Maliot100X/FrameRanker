import { notFound } from "next/navigation";
import { Metadata } from "next";
import { formatAddress } from "@/lib/neynar";
import { getProfilesByAddresses } from "@/lib/neynar-server";
import { prisma } from "@/lib/db.server";
import { cache } from "react";
import { ReviewDetailContent } from "@/components/ReviewDetailContent";
import { constructMetadata } from "@/lib/metadata";

const fetchReviewDetail = cache(
  async (reviewId: string) => {
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          reviewer: true,
          targetUser: true,
        },
      });

      if (!review) return null;

      return {
        reviewer: review.reviewer.walletAddress as `0x${string}`,
        reviewee: review.targetUser?.walletAddress as `0x${string}`,
        content: review.content,
        emoji: review.rating,
        timestamp: BigInt(Math.floor(review.createdAt.getTime() / 1000)),
        reviewId: review.id,
      };
    } catch (error) {
      console.error("Failed to fetch review detail:", error);
      return null;
    }
  }
);

export async function generateMetadata({
  params,
}: {
  params: { reviewId: string };
}): Promise<Metadata> {
  const reviewId = params.reviewId;

  try {
    const review = await fetchReviewDetail(reviewId);

    if (!review) {
      return constructMetadata({
        title: `Review #${reviewId} | FrameRanker`,
      });
    }

    const profiles = await getProfilesByAddresses([
      review.reviewer,
      review.reviewee,
    ]);
    const reviewerProfile = profiles[review.reviewer.toLowerCase()];
    const revieweeProfile = profiles[review.reviewee.toLowerCase()];

    const reviewerName =
      reviewerProfile?.displayName || formatAddress(review.reviewer);
    const revieweeName =
      revieweeProfile?.displayName || formatAddress(review.reviewee);

    const description = `${reviewerName} reviewed ${revieweeName}: "${review.content.substring(
      0,
      150
    )}${review.content.length > 150 ? "..." : ""}"`;

    return constructMetadata({
      title: `Review #${reviewId} by ${reviewerName}`,
      description,
      path: `/review/${reviewId}`,
      imageUrl: revieweeProfile?.pfp?.url,
    });
  } catch (error) {
    console.error("Failed to generate metadata for review:", error);
    return constructMetadata({
      title: `Review #${reviewId} | FrameRanker`,
    });
  }
}

export default async function ReviewDetailPage({
  params,
}: {
  params: { reviewId: string };
}) {
  const reviewId = params.reviewId;

  // For newly created reviews, we don't fetch on server to avoid RPC overload
  // Client component will handle all data fetching with caching and retry logic
  // SEO metadata is still generated in generateMetadata() for existing reviews
  return <ReviewDetailContent reviewId={reviewId} initialReview={undefined} />;
}
