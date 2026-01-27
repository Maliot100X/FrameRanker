import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";
import { verifyTransaction } from "@/lib/payment.server";

export async function POST(request: NextRequest) {
  try {
    const { 
      reviewerFid, 
      targetFid, 
      content, 
      rating, 
      txHash,
      reviewerAddress,
      targetAddress,
      reviewerUsername,
      targetUsername,
      reviewerPfp,
      targetPfp,
      paymentToken = 'ETH'
    } = await request.json();

    if (!reviewerFid || !content || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Ensure Reviewer exists or create them
    let reviewer = await prisma.user.findUnique({ where: { fid: reviewerFid } });
    if (!reviewer) {
      reviewer = await prisma.user.create({
        data: {
          fid: reviewerFid,
          username: reviewerUsername,
          walletAddress: reviewerAddress,
          pfpUrl: reviewerPfp,
          displayName: reviewerUsername
        }
      });
    }

    // 2. Ensure Target User exists or create them (if targetFid provided)
    let targetUser = null;
    if (targetFid) {
      targetUser = await prisma.user.findUnique({ where: { fid: targetFid } });
      if (!targetUser) {
        targetUser = await prisma.user.create({
          data: {
            fid: targetFid,
            username: targetUsername,
            walletAddress: targetAddress,
            pfpUrl: targetPfp,
            displayName: targetUsername
          }
        });
      }
    }

    // 3. Verify Payment (if txHash provided) - MUST Verify BEFORE creating review
    let paymentId = null;
    if (txHash) {
      const verification = await verifyTransaction(txHash, undefined, paymentToken);
      if (!verification.success) {
         return NextResponse.json({ error: "Payment verification failed: " + verification.error }, { status: 400 });
      }

      // Create Payment Record
      const payment = await prisma.payment.create({
        data: {
          userId: reviewer.id,
          txHash,
          amount: verification.amount,
          currency: paymentToken,
          status: "COMPLETED",
          purpose: "REVIEW_CREATION", // Temporary purpose until review is created
        }
      });
      paymentId = payment.id;
    }

    // 4. Create Review
    const review = await prisma.review.create({
      data: {
        reviewerFid,
        targetFid: targetFid || null,
        content,
        rating,
      }
    });

    // Update Payment Purpose with Review ID
    if (paymentId) {
        await prisma.payment.update({
            where: { id: paymentId },
            data: { purpose: `REVIEW:${review.id}` }
        });
    }

    // 5. Update Reviewer Points (Award 10 points per review)
    await prisma.user.update({
        where: { id: reviewer.id },
        data: { points: { increment: 10 } }
    });

    return NextResponse.json({ 
      success: true, 
      reviewId: review.id 
    });

  } catch (error) {
    console.error("Failed to create review:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
