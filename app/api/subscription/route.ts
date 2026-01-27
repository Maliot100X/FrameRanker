import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";
import { verifyTransaction } from "@/lib/payment.server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, txHash, fid } = body;

    if (!fid || !plan || !txHash) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine plan details
    let durationDays = 30;
    let isTrial = false;
    
    if (plan === 'trial') {
        durationDays = 7;
        isTrial = true;
    }

    // Verify Transaction
    const verification = await verifyTransaction(txHash);
    if (!verification.success) {
        return NextResponse.json({ error: "Invalid payment transaction: " + verification.error }, { status: 400 });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { txHash },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "Transaction already processed" },
        { status: 400 }
      );
    }

    // Ensure User Exists
    let userId: string;
    try {
      const user = await prisma.user.upsert({
        where: { fid: Number(fid) },
        update: {},
        create: {
          fid: Number(fid),
        },
      });
      userId = user.id;
    } catch (e) {
        console.error("Error upserting user:", e);
        return NextResponse.json({ error: "Failed to find or create user" }, { status: 500 });
    }
    
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Create Payment Record
    const payment = await prisma.payment.create({
      data: {
        userId,
        txHash,
        amount: verification.amount,
        currency: "ETH",
        status: "COMPLETED",
        purpose: isTrial ? "SUBSCRIPTION_TRIAL" : "SUBSCRIPTION_MONTHLY",
      },
    });

    // Create or Update Subscription
    // Note: If user already has a subscription, we might want to extend it or overwrite it.
    // For now, let's upsert based on userId, but Subscription schema has userId as @unique?
    // Let's check schema again. Yes, Subscription.userId is unique.
    
    const subscription = await prisma.subscription.upsert({
        where: { userId },
        update: {
            status: "ACTIVE",
            tier: isTrial ? "PRO_TRIAL" : "PRO",
            startDate,
            endDate,
            paymentId: payment.id
        },
        create: {
            userId,
            status: "ACTIVE",
            tier: isTrial ? "PRO_TRIAL" : "PRO",
            startDate,
            endDate,
            paymentId: payment.id
        }
    });

    return NextResponse.json({ 
        success: true, 
        message: "Subscription activated", 
        subscription 
    });

  } catch (error) {
    console.error("[API] Subscription Error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    );
  }
}
