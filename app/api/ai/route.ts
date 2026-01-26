import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, txHash, address, fid } = body;

    console.log("[API] AI Request Received:", { action, txHash, address, fid });

    // 1. Verify Transaction Hash (Mock for now)
    const existingPayment = await prisma.payment.findUnique({
        where: { txHash }
    });

    if (existingPayment) {
        return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });
    }

    // 2. Ensure User Exists
    let userId: string | undefined;

    if (fid) {
        const user = await prisma.user.upsert({
            where: { fid: Number(fid) },
            update: {},
            create: { fid: Number(fid) }
        });
        userId = user.id;
    } else {
        return NextResponse.json({ error: "User FID is required for AI actions" }, { status: 400 });
    }

    // 3. Create Payment Record
    // Determine price based on action? Or assume client sent correct amount?
    // We should ideally verify amount from tx.
    // For now, assume fixed prices based on action type for logging.
    const price = action === "analyze" ? "0.00008" : "0.00012";

    await prisma.payment.create({
        data: {
            userId,
            txHash,
            amount: price,
            currency: "ETH",
            status: "COMPLETED",
            purpose: `AI_${action.toUpperCase()}`,
        }
    });

    // 4. Perform AI Logic (Mock for now)
    let result;
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (action === "analyze") {
      result = {
        score: Math.floor(Math.random() * 30) + 70, // 70-100
        engagement: `${(Math.random() * 5 + 1).toFixed(1)}%`,
        recommendedBoost: "5h Boost ($3)",
        suggestion: "Your profile has good content but low visibility. Boosting during peak hours (12 PM - 4 PM UTC) could increase followers by 15-20%."
      };
    } else {
      const reviews = [
        "This user always shares high-quality insights! Highly recommended.",
        "Great builder in the Farcaster ecosystem. Follow for top-tier dev content.",
        "One of the most consistent contributors I've seen. Definitely worth a follow!",
        "Love the energy this profile brings to the timeline. 🚀"
      ];
      result = reviews[Math.floor(Math.random() * reviews.length)];
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[API] AI Error:", error);
    return NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 500 }
    );
  }
}
