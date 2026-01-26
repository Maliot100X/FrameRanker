import { NextResponse } from 'next/server';

export async function GET() {
  console.log("Cron: Weekly summary triggered");
  // In a real app, this would process weekly stats and send notifications
  return NextResponse.json({ success: true, message: "Weekly summary processed" });
}
