import { NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();

    // Fetch Active Profile Boosts
    const boostedProfiles = await prisma.boost.findMany({
      where: {
        type: "PROFILE",
        status: "ACTIVE",
        endTime: { gt: now },
      },
      include: {
        user: true, // Get user details
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 10,
    });

    // Fetch Active Post Boosts
    const boostedPosts = await prisma.boost.findMany({
      where: {
        type: "POST",
        status: "ACTIVE",
        endTime: { gt: now },
      },
      include: {
        post: {
            include: {
                author: true
            }
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 10,
    });

    // Fetch Active Coin Boosts
    const boostedCoins = await prisma.boost.findMany({
      where: {
        type: "COIN",
        status: "ACTIVE",
        endTime: { gt: now },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      boostedProfiles: boostedProfiles.map(b => ({
        ...b,
        user: {
            username: b.user.username,
            displayName: b.user.displayName,
            pfpUrl: b.user.pfpUrl,
            fid: b.user.fid
        }
      })),
      boostedPosts: boostedPosts.map(b => ({
        ...b,
        post: b.post ? {
            url: b.post.url,
            hash: b.post.hash,
            author: {
                username: b.post.author.username,
                displayName: b.post.author.displayName,
                pfpUrl: b.post.author.pfpUrl,
                fid: b.post.author.fid
            }
        } : null
      })).filter(b => b.post !== null),
      boostedCoins: boostedCoins.map(b => ({
        id: b.id,
        coinAddress: b.coinAddress,
        coinType: b.coinType,
        startTime: b.startTime,
        endTime: b.endTime
      })),
    });

  } catch (error) {
    console.error("[API] Home Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch home data" },
      { status: 500 }
    );
  }
}
