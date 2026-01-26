import { Metadata } from "next";

export const DEFAULT_METADATA: Metadata = {
  title: "FrameRanker - Farcaster Mini App",
  description:
    "Boost your visibility, rank higher, and gain insights on Farcaster.",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "FrameRanker - Farcaster Mini App",
    description:
      "Boost your visibility, rank higher, and gain insights on Farcaster.",
    images: [
      {
        url: "https://frame-ranker.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "FrameRanker",
      },
    ],
    siteName: "FrameRanker",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FrameRanker - Farcaster Mini App",
    description:
      "Boost your visibility, rank higher, and gain insights on Farcaster.",
    images: ["https://frame-ranker.vercel.app/og-image.png"],
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: "https://frame-ranker.vercel.app/og-image.png",
      button: {
        title: "Open FrameRanker",
        action: {
          type: "launch_frame",
          name: "FrameRanker",
          url: "https://frame-ranker.vercel.app",
          splashImageUrl: "https://frame-ranker.vercel.app/splash-image.png",
          splashBackgroundColor: "#7c3aed",
        },
      },
    }),
  },
};

interface GenerateMetadataProps {
  title?: string;
  description?: string;
  path?: string;
  imageUrl?: string;
  frameButtonTitle?: string;
}

export function constructMetadata({
  title,
  description,
  path = "",
  imageUrl,
  frameButtonTitle = "Open FrameRanker",
}: GenerateMetadataProps = {}): Metadata {
  // Use environment variable for base URL, fallback to production URL
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://frame-ranker.vercel.app";

  const fullUrl = path ? `${baseUrl}${path}` : baseUrl;
  const image = imageUrl || `${baseUrl}/og-image.png`;

  // Clean up title if it's passed (don't append suffix if it's the default title)
  const effectiveTitle = title
    ? title.includes("| FrameRanker")
      ? title
      : `${title} | FrameRanker`
    : "FrameRanker - Farcaster Mini App";

  const effectiveDesc = description || "Boost your visibility and rank higher on Farcaster.";

  return {
    ...DEFAULT_METADATA,
    title: effectiveTitle,
    description: effectiveDesc,
    openGraph: {
      ...DEFAULT_METADATA.openGraph,
      title: title || effectiveTitle,
      description: effectiveDesc,
      url: fullUrl,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title || "FrameRanker",
        },
      ],
      siteName: "FrameRanker",
    },
    twitter: {
      ...DEFAULT_METADATA.twitter,
      title: title || effectiveTitle,
      description: effectiveDesc,
      images: [image],
    },
    other: {
      "fc:miniapp": JSON.stringify({
        version: "1",
        imageUrl: image,
        button: {
          title: frameButtonTitle,
          action: {
            type: "launch_frame",
            name: "FrameRanker",
            url: baseUrl,
            splashImageUrl: `${baseUrl}/splash-image.png`,
            splashBackgroundColor: "#7c3aed",
          },
        },
      }),
    },
  };
}
