import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";

export async function POST(request: NextRequest) {
  try {
    const { type, txHash, fid } = await request.json();

    if (!txHash || !fid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify Payment (Mock verification for now, or check on-chain if using proper RPC)
    // In production, we should query the blockchain to confirm the txHash matches the expected amount and receiver.
    
    // 2. Create Payment Record
    const user = await prisma.user.findUnique({ where: { fid: Number(fid) } });
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const payment = await prisma.payment.create({
        data: {
            userId: user.id,
            txHash,
            amount: 0.0001, // Placeholder, should come from request or validation
            currency: "ETH",
            status: "COMPLETED",
            purpose: type === "BOOST" ? "AI_BOOST" : "AI_REVIEW"
        }
    });

    // 3. Execute Action
    if (type === "BOOST") {
        // Create a 1 hour boost
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        
        await prisma.boost.create({
            data: {
                userId: user.id,
                type: "PROFILE",
                startTime,
                endTime,
                status: "ACTIVE",
                paymentId: payment.id
            }
        });
    } else if (type === "REVIEW") {
        // Generate Review (Mock or real AI generation)
        const reviewContent = "This is an AI generated review. Excellent profile with high engagement!";
        
        await prisma.review.create({
            data: {
                reviewerFid: 999999, // AI Bot FID (placeholder)
                targetFid: user.fid,
                content: reviewContent,
                rating: 5
            }
        });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("AI Action API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
