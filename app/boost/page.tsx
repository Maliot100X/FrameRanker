"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useFrame } from "@/components/providers/FrameProvider";

const PAYMENT_RECEIVER = process.env.NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS || "0xYourTreasuryAddressHere";

type Duration = "1h" | "5h" | "24h";
const PRICING: Record<Duration, { price: string; label: string }> = {
  "1h": { price: "0.0004", label: "$1" }, // Approx ETH price for $1 (assuming $2500/ETH) - simplified
  "5h": { price: "0.0012", label: "$3" },
  "24h": { price: "0.0024", label: "$6" },
};

export default function BoostPage() {
  const { isConnected, address } = useAccount();
  const { user } = useFrame();
  const [profileDuration, setProfileDuration] = useState<Duration>("1h");
  const [postDuration, setPostDuration] = useState<Duration>("1h");
  const [postUrl, setPostUrl] = useState("");
  const [postPreview, setPostPreview] = useState<{ username: string, hash: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { sendTransactionAsync } = useSendTransaction();

  // Simple URL parser for preview
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPostUrl(url);
    
    // Try to extract username and hash
    // Format: https://warpcast.com/username/0xhash
    const match = url.match(/warpcast\.com\/([^/]+)\/(0x[a-fA-F0-9]+)/);
    if (match) {
        setPostPreview({
            username: match[1],
            hash: match[2]
        });
    } else {
        setPostPreview(null);
    }
  };

  const handleBoost = async (type: "profile" | "post") => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (type === "post" && !postUrl) {
      toast.error("Please enter a valid Farcaster cast URL");
      return;
    }

    setIsProcessing(true);
    const duration = type === "profile" ? profileDuration : postDuration;
    const price = PRICING[duration].price;

    try {
      // 1. Send Payment
      const hash = await sendTransactionAsync({
        to: PAYMENT_RECEIVER as `0x${string}`,
        value: parseEther(price),
      });

      toast.info("Transaction sent! Waiting for confirmation...");

      // 2. Wait for Receipt (Client side wait or Optimistic update)
      // In a real app, we'd wait or send the hash to backend immediately
      
      // 3. Call API to register boost
      const response = await fetch("/api/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          duration,
          amount: price,
          txHash: hash,
          target: type === "profile" ? address : postUrl,
          fid: user?.fid,
        }),
      });

      if (!response.ok) throw new Error("Failed to register boost");

      toast.success(`${type === "profile" ? "Profile" : "Post"} boosted successfully!`);
      if (type === "post") setPostUrl("");
      
    } catch (error) {
      console.error("Boost failed:", error);
      toast.error("Boost failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <h1 className="text-3xl font-bold mb-6">Boost Visibility</h1>
      
      <div className="grid gap-6">
        {/* Boost Profile Section */}
        <Card className="p-6 border-pink-500/20 bg-gray-900/50 backdrop-blur">
          <h2 className="text-xl font-semibold mb-2 text-pink-500">Boost Profile</h2>
          <p className="text-gray-400 mb-4 text-sm">
            Get your profile on the top of the leaderboard and increase visibility.
          </p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PRICING) as Duration[]).map((d) => (
                <Button 
                  key={d}
                  variant={profileDuration === d ? "default" : "outline"}
                  className={`flex flex-col h-auto py-3 ${
                    profileDuration === d 
                      ? "bg-pink-600 hover:bg-pink-700 border-transparent" 
                      : "border-pink-500/30 hover:bg-pink-500/10 hover:text-pink-400"
                  }`}
                  onClick={() => setProfileDuration(d)}
                >
                  <span className="font-bold text-lg">{d}</span>
                  <span className={`text-xs ${profileDuration === d ? "text-pink-100" : "text-gray-400"}`}>
                    {PRICING[d].label}
                  </span>
                </Button>
              ))}
            </div>
            <Button 
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => handleBoost("profile")}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Boost My Profile
            </Button>
          </div>
        </Card>

        {/* Boost Post Section */}
        <Card className="p-6 border-purple-500/20 bg-gray-900/50 backdrop-blur">
          <h2 className="text-xl font-semibold mb-2 text-purple-500">Boost Post</h2>
          <p className="text-gray-400 mb-4 text-sm">
            Paste a Farcaster cast URL to boost its reach.
          </p>
          
          <div className="space-y-4">
            <Input
              placeholder="Paste Farcaster cast URL (e.g. https://warpcast.com/...)"
              value={postUrl}
              onChange={handleUrlChange}
              className="bg-gray-800/50 border-gray-700"
            />
            
            {postPreview && (
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-purple-400">Cast</span>
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-purple-200">Boosting Cast</p>
                        <p className="text-xs text-gray-400 truncate">by @{postPreview.username}</p>
                        <p className="text-xs text-gray-500 truncate font-mono">{postPreview.hash}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PRICING) as Duration[]).map((d) => (
                <Button 
                  key={d}
                  variant={postDuration === d ? "default" : "outline"}
                  className={`flex flex-col h-auto py-3 ${
                    postDuration === d 
                      ? "bg-purple-600 hover:bg-purple-700 border-transparent" 
                      : "border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-400"
                  }`}
                  onClick={() => setPostDuration(d)}
                >
                  <span className="font-bold text-lg">{d}</span>
                  <span className={`text-xs ${postDuration === d ? "text-purple-100" : "text-gray-400"}`}>
                    {PRICING[d].label}
                  </span>
                </Button>
              ))}
            </div>
            
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => handleBoost("post")}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Boost Post
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
