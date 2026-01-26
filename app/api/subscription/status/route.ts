import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get('fid');

  if (!fid) {
    return NextResponse.json({ error: "FID required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { fid: Number(fid) },
      include: { subscription: true }
    });

    if (!user) {
        return NextResponse.json({ isSubscribed: false });
    }

    const sub = user.subscription;
    if (!sub) {
        return NextResponse.json({ isSubscribed: false });
    }

    const now = new Date();
    const isActive = sub.status === 'ACTIVE' && sub.endDate > now;

    return NextResponse.json({ 
        isSubscribed: isActive,
        subscription: sub
    });

  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
