import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, username, displayName, pfpUrl } = body;

    if (!fid) {
      return NextResponse.json(
        { error: "FID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { fid: Number(fid) },
      update: {
        username,
        displayName,
        pfpUrl,
      },
      create: {
        fid: Number(fid),
        username,
        displayName,
        pfpUrl,
      },
    });

    return NextResponse.json({ success: true, user });

  } catch (error) {
    console.error("[API] Sync User Error:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}
