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
    if (fid) {
        try {
            const user = await prisma.user.findUnique({
            where: { fid: Number(fid) },
            include: {
                reviewsReceived: true
            }
        });
        
        if (user) {
            userStats = `
User Stats:
- Points: ${user.points}
- Reviews Received: ${user.reviewsReceived.length}
- Bio: ${user.bio || "None"}
            `;
        }
        } catch (e) {
            console.error("Failed to fetch user stats for AI", e);
        }
    }

    let systemPrompt = `
You are FrameRanker AI, an assistant for a Farcaster Mini App.
Your goal is to help users boost their profiles, get reviews, and understand the leaderboard.
Users can pay for:
1. "BOOST": Increases visibility on the leaderboard. Prices: 1h ($1), 5h ($3), 24h ($6).
2. "REVIEW": AI generates a detailed review of their profile. Price: $0.30.

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
You are FrameRanker AI. The user wants to post a cast to Farcaster.
Generate a catchy, engaging Farcaster cast (max 320 chars) about their experience on FrameRanker.
Include emojis and hashtags like #FrameRanker #Base.
Mention their username @${username} if known.
If you know their stats, mention them (e.g. "I just hit ${userStats ? 'X points' : 'new milestones'} on FrameRanker!").
Encourage others to check out the app.
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
