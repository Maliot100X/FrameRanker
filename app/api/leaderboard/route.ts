import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";

// MOCK DATA FOR NOW since we don't have enough real data for FrameRanker logic
// In production, this would query Supabase for boosts and smart contract for reviews

export interface LeaderboardEntry {
  id: string;
  address?: string;
  url?: string;
  score: number;
  rank?: number;
}

export interface LeaderboardData {
  topProfiles: LeaderboardEntry[];
  topPosts: LeaderboardEntry[];
  topReviewers: LeaderboardEntry[];
  lastUpdated: number;
}

// Server-side memory cache (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let leaderboardCache: LeaderboardData | null = null;
let cacheTimestamp = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get("forceRefresh") === "true";

    // Return cached data if still valid
    if (
      !forceRefresh &&
      leaderboardCache &&
      Date.now() - cacheTimestamp < CACHE_DURATION
    ) {
      console.log("[API] Returning cached leaderboard data");
      return NextResponse.json(leaderboardCache, {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
        },
      });
    }

    console.log("[API] Generating leaderboard data...");

    // 1. Fetch Active Profile Boosts
    let boostedProfiles: LeaderboardEntry[] = [];
    try {
        const activeProfileBoosts = await prisma.boost.findMany({
            where: {
                type: 'PROFILE',
                status: 'ACTIVE',
                endTime: { gt: new Date() }
            },
            include: { user: true },
            orderBy: { startTime: 'desc' }
        });

        boostedProfiles = activeProfileBoosts.map((boost, i) => ({
            id: boost.userId,
            address: boost.user.walletAddress || undefined,
            username: boost.user.username || undefined,
            pfpUrl: boost.user.pfpUrl || undefined,
            score: 10000, // High score for boosted
            rank: i + 1,
        }));
    } catch (e) {
        console.error("Failed to fetch profile boosts:", e);
    }

    // 2. Fetch Active Post Boosts
    let boostedPosts: LeaderboardEntry[] = [];
    try {
        const activePostBoosts = await prisma.boost.findMany({
            where: {
                type: 'POST',
                status: 'ACTIVE',
                endTime: { gt: new Date() }
            },
            include: { post: true },
            orderBy: { startTime: 'desc' }
        });

        boostedPosts = activePostBoosts.map((boost, i) => ({
            id: boost.targetPostId!,
            url: boost.post?.url,
            score: 5000, // High score for boosted
            rank: i + 1,
        }));
    } catch (e) {
        console.error("Failed to fetch post boosts:", e);
    }

    // 3. Fetch Top Reviewers (Real Data)
    let topReviewers: LeaderboardEntry[] = [];
    try {
        const reviewers = await prisma.user.findMany({
            orderBy: {
                reviewsGiven: {
                    _count: 'desc'
                }
            },
            take: 10,
            include: {
                _count: {
                    select: { reviewsGiven: true }
                }
            }
        });

        topReviewers = reviewers.map((user, i) => ({
            id: user.id,
            address: user.walletAddress || undefined,
            username: user.username || undefined,
            pfpUrl: user.pfpUrl || undefined,
            score: user._count.reviewsGiven * 10, // 10 points per review
            rank: i + 1,
        }));
    } catch (e) {
        console.error("Failed to fetch top reviewers:", e);
    }

    // Combine data (Boosted profiles are top, followed by organic logic if implemented)
    // For now, leaderboard is primarily boosted profiles + top reviewers
    
    const topProfiles = boostedProfiles; // + organic top profiles if implemented
    const topPosts = boostedPosts; // + organic top posts if implemented

    leaderboardCache = {
      topProfiles,
      topPosts,
      topReviewers,
      lastUpdated: Date.now(),
    };
    cacheTimestamp = Date.now();

    return NextResponse.json(leaderboardCache);
  } catch (error) {
    console.error("[API] Error generating leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
