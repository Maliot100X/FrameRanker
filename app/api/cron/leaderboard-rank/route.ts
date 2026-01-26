import { NextResponse } from 'next/server';

export async function GET() {
  console.log("Cron: Leaderboard rank update triggered");
  // In a real app, this would recalculate ranks and store snapshots
  return NextResponse.json({ success: true, message: "Leaderboard updated" });
}
