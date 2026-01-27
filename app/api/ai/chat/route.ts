import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.server";

const AIML_API_KEY = process.env.AIML_API_KEY;
const BASE_URL = "https://api.aimlapi.com/chat/completions"; // Standard AIML endpoint

export async function POST(request: NextRequest) {
  try {
    const { message, fid, username, isCastCommand } = await request.json();

    if (!AIML_API_KEY) {
        return NextResponse.json({ 
            message: "I'm running in offline mode. I can help you with basic info about FrameRanker.",
            action: null
        });
    }

    // Fetch user stats from DB
    let userStats = "";
    let rank = 0;
    let isBoosted = false;
    let points = 0;

    if (fid) {
        try {
            const user = await prisma.user.findUnique({
                where: { fid: Number(fid) },
                include: {
                    reviewsReceived: true,
                    boosts: {
                        where: { status: 'ACTIVE', endTime: { gt: new Date() } }
                    }
                }
            });
        
            if (user) {
                points = user.points;
                isBoosted = user.boosts.length > 0;
                
                // Calculate Rank
                rank = await prisma.user.count({
                    where: { points: { gt: user.points } }
                }) + 1;

                userStats = `
User Stats:
- Rank: #${rank}
- Points: ${points}
- Reviews Received: ${user.reviewsReceived.length}
- Boost Status: ${isBoosted ? "Active" : "Inactive"}
- Bio: ${user.bio || "None"}
                `;
            }
        } catch (e) {
            console.error("Failed to fetch user stats for AI", e);
        }
    }

    let systemPrompt = `
You are FrameRanker AI, the assistant for FrameRanker (a Farcaster Mini App).
FrameRanker allows users to:
1. Review others: Share authentic feedback and earn points.
2. Boost Profiles/Casts/Coins: Increase visibility on the leaderboard and home page.
3. Compete on the Leaderboard: Ranked by points and activity.
4. Participate in Giveaways: Active users get rewards.
5. Use the /cast command: Share your rank and score on Farcaster.

Supported Currencies: FrameRanker Coin (Zora), USDC, and ETH.

If the user asks for a boost or review, explain the benefits and ask if they want to proceed.
If they confirm they want to buy, output a specific JSON marker at the end of your message.

Output format:
Just natural language response.
BUT if the user explicitly wants to buy a boost or review, append this JSON block at the very end:
|||{"type": "BOOST" | "REVIEW", "price": "0.0003", "label": "1h Boost", "description": "Boost your profile for 1 hour"}|||

Current ETH price is roughly $3000.
$1 = 0.00033 ETH
$3 = 0.001 ETH
$6 = 0.002 ETH
$0.30 = 0.0001 ETH

User context: FID: ${fid}, Username: ${username}
${userStats}
    `;

    if (isCastCommand) {
        systemPrompt = `
You are FrameRanker AI. The user wants to post a cast to Farcaster using the /cast command.
Generate a catchy, engaging Farcaster cast (max 320 chars) about their experience on FrameRanker.

MANDATORY INCLUSIONS:
- Rank: #${rank}
- Score: ${points} Points
- Boost Status: ${isBoosted ? "🚀 Boosted" : ""}
- App Link: https://frames.maliot.io/ranker (or FrameRanker)
- Hashtags: #FrameRanker #Base #Zora

NEVER ask for payment in the cast text.
Do NOT output the JSON action marker. Just the cast text.

User context: FID: ${fid}, Username: ${username}
${userStats}
        `;
    }

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AIML_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("AIML Error:", err);
        return NextResponse.json({ message: "Sorry, I'm having trouble connecting to my brain right now." });
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    let action = null;

    // Parse for action marker
    const markerRegex = /\|\|\|(\{.*\})\|\|\|/;
    const match = content.match(markerRegex);
    if (match) {
        try {
            action = JSON.parse(match[1]);
            content = content.replace(match[0], "").trim();
        } catch (e) {
            console.error("Failed to parse action JSON", e);
        }
    }

    return NextResponse.json({ message: content, action });

  } catch (error) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
