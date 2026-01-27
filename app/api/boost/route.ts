import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";
import { verifyTransaction } from "@/lib/payment.server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, duration, amount, txHash, target, fid } = body;

    console.log("[API] Boost Request Received:", { type, duration, amount, txHash, target, fid });

    // Calculate end time
    const durationMap: Record<string, number> = {
      "1h": 1,
      "5h": 5,
      "24h": 24,
    };
    const hours = durationMap[duration] || 1;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

    // 1. Verify Transaction Hash
    if (txHash) {
      const verification = await verifyTransaction(txHash, Number(amount));
      if (!verification.success) {
        return NextResponse.json(
          { error: `Payment verification failed: ${verification.error}` },
          { status: 400 }
        );
      }
    }

    // Check if payment already exists
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
        create: {
            fid: Number(fid),
        }
      });
      userId = user.id;
    } else {
        // If no FID provided, checking if we can proceed is tricky.
        // For now, return error as we need to link boost to a user.
        return NextResponse.json({ error: "User FID is required for boosting" }, { status: 400 });
    }

    // 3. Create Payment Record
    const payment = await prisma.payment.create({
        data: {
            userId,
            txHash,
            amount: amount, // Prisma handles string/number for Decimal
            currency: "ETH",
            status: "COMPLETED", // Optimistic completion
            purpose: `BOOST_${duration.toUpperCase()}`,
        }
    });

    // 4. Create Boost Record
    let boost;
    if (type === 'profile') {
        boost = await prisma.boost.create({
            data: {
                userId,
                type: "PROFILE",
                startTime,
                endTime,
                status: "ACTIVE",
                paymentId: payment.id
            }
        });
    } else if (type === 'post') {
        if (!target) {
             return NextResponse.json({ error: "Post URL is required" }, { status: 400 });
        }

        // 1. Fetch Cast Data from Neynar
        let castData = null;
        const apiKey = process.env.NEYNAR_API_KEY;

        if (apiKey) {
            try {
                 // Extract hash from URL: https://warpcast.com/username/0xHASH
                const match = target.match(/\/0x([a-fA-F0-9]+)$/);
                const hash = match ? '0x' + match[1] : null;

                if (hash) {
                     const response = await fetch(
                        `https://api.neynar.com/v2/farcaster/cast?identifier=${hash}&type=hash`,
                        {
                            headers: {
                                'x-api-key': apiKey,
                                'accept': 'application/json'
                            }
                        }
                    );
                    if (response.ok) {
                        const data = await response.json();
                        castData = data.cast;
                    }
                }
            } catch (err) {
                console.error("Neynar API Error:", err);
            }
        }

        // 2. Fallback / Mock Data if API fails (for development without API key)
        if (!castData) {
            // Create a mock cast if we can't fetch real one (Development mode)
             // In production, we should probably fail here.
             // Extract hash from URL as fallback ID
             const match = target.match(/\/0x([a-fA-F0-9]+)$/);
             const hash = match ? '0x' + match[1] : `mock-${Date.now()}`;
             
             castData = {
                 hash: hash,
                 author: {
                     fid: Number(fid), // Fallback to booster as author
                 }
             };
        }

        // 3. Ensure Author Exists
        await prisma.user.upsert({
            where: { fid: castData.author.fid },
            update: {},
            create: { fid: castData.author.fid }
        });

        // 4. Upsert Post
        const post = await prisma.post.upsert({
            where: { url: target },
            update: {},
            create: {
                url: target,
                hash: castData.hash,
                authorFid: castData.author.fid,
            }
        });

        // 5. Create Boost
        boost = await prisma.boost.create({
            data: {
                userId,
                type: "POST",
                targetPostId: post.id,
                startTime,
                endTime,
                status: "ACTIVE",
                paymentId: payment.id
            }
        });
    } else if (type === 'coin') {
        if (!target) {
             return NextResponse.json({ error: "Coin address is required" }, { status: 400 });
        }
        
        boost = await prisma.boost.create({
            data: {
                userId,
                type: "COIN",
                coinAddress: target,
                coinType: "BASE",
                startTime,
                endTime,
                status: "ACTIVE",
                paymentId: payment.id
            }
        });
    }

    return NextResponse.json({ success: true, message: "Boost activated", boost });

  } catch (error) {
    console.error("[API] Boost Error:", error);
    return NextResponse.json(
      { error: "Failed to process boost" },
      { status: 500 }
    );
  }
}
