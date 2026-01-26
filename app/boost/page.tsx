"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Loader2, CheckCircle, AlertCircle, Zap, TrendingUp, Coins } from "lucide-react";
import { toast } from "sonner";
import { useFrame } from "@/components/providers/FrameProvider";

const PAYMENT_RECEIVER = process.env.NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS || "0xYourTreasuryAddressHere";
// Placeholder Zora Coin Contract Address (Example: Zora on Base)
const ZORA_COIN_ADDRESS = "0x7777777333332222211111999999888888"; 

type Duration = "1h" | "5h" | "24h";
const PRICING: Record<Duration, { price: string; label: string }> = {
  "1h": { price: "0.0004", label: "$1" }, // Approx ETH price for $1 (assuming $2500/ETH) - simplified
  "5h": { price: "0.0012", label: "$3" },
  "24h": { price: "0.0024", label: "$6" },
};

type TabType = "profile" | "post" | "coin";

export default function BoostPage() {
  const { isConnected, address } = useAccount();
  const { user } = useFrame();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  
  const [profileDuration, setProfileDuration] = useState<Duration>("1h");
  const [postDuration, setPostDuration] = useState<Duration>("1h");
  const [coinDuration, setCoinDuration] = useState<Duration>("1h");
  
  const [postUrl, setPostUrl] = useState("");
  const [coinAddress, setCoinAddress] = useState("");
  
  const [postPreview, setPostPreview] = useState<{ username: string, hash: string } | null>(null);
  const [postData, setPostData] = useState<{
    hash: string;
    author: {
      fid: number;
      username: string;
      displayName: string;
      profileImage: string;
    };
    text: string;
    timestamp: string;
    reactions: {
      likes: number;
      recasts: number;
    };
    embeds: any[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const { sendTransactionAsync } = useSendTransaction();

  // URL parser and fetcher for preview
  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPostUrl(url);
    
    // Format: https://warpcast.com/username/0xhash
    const match = url.match(/warpcast\.com\/([^/]+)\/(0x[a-fA-F0-9]+)/);
    
    if (match) {
        setPostPreview({
            username: match[1],
            hash: match[2]
        });
        
        // Fetch real data from Neynar via our API
        setIsPreviewLoading(true);
        try {
          const res = await fetch(`/api/neynar/cast?url=${encodeURIComponent(url)}`);
          if (res.ok) {
            const data = await res.json();
            setPostData(data);
          } else {
            setPostData(null);
            console.error("Failed to fetch cast preview");
          }
        } catch (err) {
          console.error("Error fetching preview:", err);
          setPostData(null);
        } finally {
          setIsPreviewLoading(false);
        }
    } else {
        setPostPreview(null);
        setPostData(null);
    }
  };

  const handleBoost = async (type: TabType) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (type === "post" && !postUrl) {
      toast.error("Please enter a valid Farcaster cast URL");
      return;
    }

    if (type === "coin" && !coinAddress) {
        toast.error("Please enter a valid Coin Contract Address");
        return;
    }

    setIsProcessing(true);
    const duration = type === "profile" ? profileDuration : type === "post" ? postDuration : coinDuration;
    const price = PRICING[duration].price;

    try {
      const hash = await sendTransactionAsync({
        to: PAYMENT_RECEIVER as `0x${string}`,
        value: parseEther(price),
      });

      toast.success("Payment sent! Processing boost...");

      // Notify backend
      const response = await fetch("/api/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: type.toUpperCase(), // PROFILE, POST, COIN
          duration,
          amount: price,
          txHash: hash,
          target: type === "post" ? postUrl : type === "coin" ? coinAddress : undefined,
          fid: user?.fid,
        }),
      });

      if (!response.ok) throw new Error("Backend processing failed");

      toast.success("Boost activated successfully!");
      setPostUrl("");
      setCoinAddress("");
      setPostData(null);
    } catch (error) {
      console.error("Boost failed:", error);
      toast.error("Payment failed or rejected");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
        Boost Your Reach
      </h1>

      <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 rounded-lg">
        <Button
            variant={activeTab === "profile" ? "default" : "ghost"}
            className={`flex-1 ${activeTab === "profile" ? "bg-yellow-600 hover:bg-yellow-700" : "text-gray-400"}`}
            onClick={() => setActiveTab("profile")}
        >
            <Zap className="w-4 h-4 mr-2" />
            Profile
        </Button>
        <Button
            variant={activeTab === "post" ? "default" : "ghost"}
            className={`flex-1 ${activeTab === "post" ? "bg-pink-600 hover:bg-pink-700" : "text-gray-400"}`}
            onClick={() => setActiveTab("post")}
        >
            <TrendingUp className="w-4 h-4 mr-2" />
            Cast
        </Button>
        <Button
            variant={activeTab === "coin" ? "default" : "ghost"}
            className={`flex-1 ${activeTab === "coin" ? "bg-blue-600 hover:bg-blue-700" : "text-gray-400"}`}
            onClick={() => setActiveTab("coin")}
        >
            <Coins className="w-4 h-4 mr-2" />
            Coin
        </Button>
      </div>

      <div className="space-y-6">
        {activeTab === "profile" && (
            <Card className="p-6 bg-gray-900 border-yellow-500/20">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="text-yellow-500" />
                Boost Profile
            </h2>
            <p className="text-gray-400 mb-6">
                Get your profile featured on the home page and leaderboard. Increase visibility and followers.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {(Object.keys(PRICING) as Duration[]).map((d) => (
                <button
                    key={d}
                    onClick={() => setProfileDuration(d)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                    profileDuration === d
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-gray-800 bg-gray-900 hover:border-gray-700"
                    }`}
                >
                    <div className="text-xl font-bold">{d}</div>
                    <div className="text-sm text-gray-400">{PRICING[d].label}</div>
                </button>
                ))}
            </div>

            <Button
                onClick={() => handleBoost("profile")}
                disabled={isProcessing}
                className="w-full bg-yellow-600 hover:bg-yellow-700 h-12 text-lg font-bold"
            >
                {isProcessing ? (
                <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                </>
                ) : (
                `Boost for ${PRICING[profileDuration].label}`
                )}
            </Button>
            </Card>
        )}

        {activeTab === "post" && (
            <Card className="p-6 bg-gray-900 border-pink-500/20">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="text-pink-500" />
                Boost Cast
            </h2>
            <p className="text-gray-400 mb-6">
                Feature a specific cast to get more likes, recasts, and replies.
            </p>

            <div className="space-y-4 mb-6">
                <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                    Cast URL (Warpcast)
                </label>
                <Input
                    placeholder="https://warpcast.com/..."
                    value={postUrl}
                    onChange={handleUrlChange}
                    className="bg-gray-800 border-gray-700"
                />
                </div>

                {isPreviewLoading && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading preview...
                    </div>
                )}

                {postData && (
                    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                            {postData.author.profileImage && (
                                <img src={postData.author.profileImage} alt="Profile" className="w-10 h-10 rounded-full" />
                            )}
                            <div>
                                <div className="font-bold">{postData.author.displayName}</div>
                                <div className="text-xs text-gray-400">@{postData.author.username}</div>
                            </div>
                        </div>
                        <p className="text-sm mb-2">{postData.text}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                            <span>❤️ {postData.reactions.likes}</span>
                            <span>🔁 {postData.reactions.recasts}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {(Object.keys(PRICING) as Duration[]).map((d) => (
                <button
                    key={d}
                    onClick={() => setPostDuration(d)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                    postDuration === d
                        ? "border-pink-500 bg-pink-500/10"
                        : "border-gray-800 bg-gray-900 hover:border-gray-700"
                    }`}
                >
                    <div className="text-xl font-bold">{d}</div>
                    <div className="text-sm text-gray-400">{PRICING[d].label}</div>
                </button>
                ))}
            </div>

            <Button
                onClick={() => handleBoost("post")}
                disabled={isProcessing || !postUrl || isPreviewLoading}
                className="w-full bg-pink-600 hover:bg-pink-700 h-12 text-lg font-bold"
            >
                {isProcessing ? (
                <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                </>
                ) : (
                `Boost for ${PRICING[postDuration].label}`
                )}
            </Button>
            </Card>
        )}

        {activeTab === "coin" && (
            <Card className="p-6 bg-gray-900 border-blue-500/20">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Coins className="text-blue-500" />
                Boost Coin
            </h2>
            <p className="text-gray-400 mb-6">
                Boost visibility for a Zora Coin or any Base token.
            </p>

            <div className="space-y-4 mb-6">
                <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                    Coin Contract Address (Base)
                </label>
                <Input
                    placeholder="0x..."
                    value={coinAddress}
                    onChange={(e) => setCoinAddress(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                />
                <p className="text-xs text-gray-500 mt-2">
                    Future integration: Pasting Zora coin contract will enable auto-payments.
                </p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {(Object.keys(PRICING) as Duration[]).map((d) => (
                <button
                    key={d}
                    onClick={() => setCoinDuration(d)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                    coinDuration === d
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-gray-800 bg-gray-900 hover:border-gray-700"
                    }`}
                >
                    <div className="text-xl font-bold">{d}</div>
                    <div className="text-sm text-gray-400">{PRICING[d].label}</div>
                </button>
                ))}
            </div>

            <Button
                onClick={() => handleBoost("coin")}
                disabled={isProcessing || !coinAddress}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold"
            >
                {isProcessing ? (
                <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                </>
                ) : (
                `Boost for ${PRICING[coinDuration].label}`
                )}
            </Button>
            </Card>
        )}
      </div>
    </div>
  );
}
