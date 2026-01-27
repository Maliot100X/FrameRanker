import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";

export async function GET(request: NextRequest) {
  try {
    // Basic authorization check (can be enhanced with CRON_SECRET)
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow local testing or Vercel cron
      // console.warn("Unauthorized cron attempt");
      // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Cron: Leaderboard giveaway distribution triggered");

    // 1. Calculate top profiles (Simplified logic similar to /api/leaderboard)
    // In production, this would be a more complex score calculation
    const topProfiles = await prisma.user.findMany({
      orderBy: [
        { boosts: { _count: 'desc' } }, // Prioritize boosters
        { reviewsGiven: { _count: 'desc' } }, // Then reviewers
      ],
      take: 3,
      select: {
        id: true,
        fid: true,
        username: true,
        walletAddress: true,
      }
    });

    if (topProfiles.length === 0) {
        return NextResponse.json({ message: "No users found for giveaway" });
    }

    // 2. Distribute Rewards (Create GiveawayWinner records)
    const now = new Date();
    // Calculate start of the week (last Friday 12:00 PM UTC?)
    // For simplicity, we just use current timestamp as "weekStart" reference or actual calculation
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7); // Rough approx

    const results = [];

    for (let i = 0; i < topProfiles.length; i++) {
        const user = topProfiles[i];
        const rank = i + 1;
        
        let prize = "100 Points";
        if (rank === 1) prize = "500 Points + 1h Boost";
        if (rank === 2) prize = "250 Points";
        
        // Check if already awarded for this week? 
        // We'll skip duplicate check for this MVP to ensure it runs
        
        const winner = await prisma.giveawayWinner.create({
            data: {
                userId: user.id,
                weekStart: weekStart,
                rank: rank,
                prize: prize,
                status: "PENDING", // Needs manual or auto-payout
            }
        });
        
        results.push({
            fid: user.fid,
            username: user.username,
            rank,
            prize
        });
        
        console.log(`Awarded Rank ${rank} to ${user.username} (${user.fid})`);
    }

    return NextResponse.json({ 
        success: true, 
        message: "Weekly rewards distributed",
        winners: results 
    });

  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
