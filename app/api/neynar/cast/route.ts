import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { error: 'Cast URL is required' },
      { status: 400 }
    )
  }

  try {
    const apiKey = process.env.NEYNAR_API_KEY
    if (!apiKey) {
      throw new Error('NEYNAR_API_KEY is not configured')
    }

    // Extract hash from URL
    // Supports formats:
    // https://warpcast.com/username/0xHASH
    // https://warpcast.com/username/HASH
    // https://warpcast.com/~/conversations/0xHASH
    
    let hash = '';
    
    // Remove query parameters
    const cleanUrl = url.split('?')[0];
    
    // 1. Try to find 0x-prefixed hash in the URL path
    const hashMatch = cleanUrl.match(/(0x[a-fA-F0-9]+)/);
    
    if (hashMatch) {
      hash = hashMatch[1];
    } else {
      // 2. Fallback: Check last path segment if it's raw hex (no 0x)
      const parts = cleanUrl.split('/');
      const lastPart = parts[parts.length - 1];
      
      if (/^[a-fA-F0-9]+$/.test(lastPart)) {
        // Assume it's a hash if it's reasonably long (e.g. > 10 chars)
        if (lastPart.length >= 10) {
          hash = '0x' + lastPart;
        }
      }
    }

    if (!hash) {
      return NextResponse.json(
        { error: 'Invalid cast URL format' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/cast?identifier=${hash}&type=hash`,
      {
        headers: {
          'x-api-key': apiKey,
          'accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Cast not found' }, { status: 404 })
      }
      throw new Error(`Neynar API error: ${response.status}`)
    }

    const data = await response.json()
    const cast = data.cast

    if (!cast) {
      return NextResponse.json(
        { error: 'Cast not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      hash: cast.hash,
      author: {
        fid: cast.author.fid,
        username: cast.author.username,
        displayName: cast.author.display_name,
        profileImage: cast.author.pfp_url
      },
      text: cast.text,
      timestamp: cast.timestamp,
      reactions: {
        likes: cast.reactions?.likes_count || 0,
        recasts: cast.reactions?.recasts_count || 0
      },
      embeds: cast.embeds || [],
      parentUrl: cast.parent_url
    })
  } catch (error: any) {
    console.error('Neynar API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cast data' },
      { status: 500 }
    )
  }
}

