import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { fid: parseInt(fid) },
      select: { hasSeenTour: true },
    });

    if (!user) {
        // If user doesn't exist yet (not synced), return false to show tour
        return NextResponse.json({ hasSeenTour: false });
    }

    return NextResponse.json({ hasSeenTour: user.hasSeenTour });
  } catch (error) {
    console.error("Error fetching tour status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid } = body;

    if (!fid) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }

    // Upsert user to ensure they exist, setting hasSeenTour to true
    // We assume minimal fields here, sync will fill the rest
    await prisma.user.upsert({
      where: { fid: parseInt(fid) },
      update: { hasSeenTour: true },
      create: { 
        fid: parseInt(fid),
        hasSeenTour: true
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating tour status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
