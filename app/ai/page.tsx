"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount, useSendTransaction } from "wagmi";
import { parseEther } from "viem";
import { Loader2, Bot, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { useFrame } from "@/components/providers/FrameProvider";

const PAYMENT_RECEIVER = process.env.NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS || "0xYourTreasuryAddressHere";

const ACTIONS = {
  ANALYZE: { price: "0.00008", label: "$0.20", id: "analyze" },
  REVIEW: { price: "0.00012", label: "$0.30", id: "review" },
};

export default function AIPage() {
  const { isConnected, address } = useAccount();
  const { user } = useFrame();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [generatedReview, setGeneratedReview] = useState<string | null>(null);

  const { sendTransactionAsync } = useSendTransaction();

  const handleAIAction = async (actionId: "analyze" | "review") => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsProcessing(actionId);
    const action = actionId === "analyze" ? ACTIONS.ANALYZE : ACTIONS.REVIEW;

    try {
      // 1. Send Payment
      const hash = await sendTransactionAsync({
        to: PAYMENT_RECEIVER as `0x${string}`,
        value: parseEther(action.price),
      });

      toast.info("Payment sent! AI is thinking...");

      // 2. Call API
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionId,
          txHash: hash,
          address,
          fid: user?.fid,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "AI action failed");

      if (actionId === "analyze") {
        setAnalysis(data.result);
        toast.success("Profile analysis complete!");
      } else {
        setGeneratedReview(data.result);
        toast.success("Review generated!");
      }

    } catch (error) {
      console.error("AI Action failed:", error);
      toast.error("AI Action failed. Please try again.");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Bot className="w-8 h-8 text-blue-400" />
        AI Assistant
      </h1>
      
      <div className="grid gap-6">
        <Card className="p-6 bg-gray-900/50 backdrop-blur border-blue-500/20">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold">Smart Ranking Assistant</h2>
            <p className="text-gray-400 text-sm">
              Let AI analyze your profile and content to suggest the best boosting strategy.
            </p>
            
            <div className="w-full space-y-3 pt-4">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 relative overflow-hidden group"
                onClick={() => handleAIAction("analyze")}
                disabled={!!isProcessing}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isProcessing === "analyze" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Analyze My Profile ({ACTIONS.ANALYZE.label})
              </Button>
              
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 relative overflow-hidden group"
                onClick={() => handleAIAction("review")}
                disabled={!!isProcessing}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isProcessing === "review" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Generate Review ({ACTIONS.REVIEW.label})
              </Button>
            </div>
          </div>
        </Card>

        {/* Results Section */}
        {(analysis || generatedReview) && (
          <Card className="p-6 border-green-500/20 bg-gray-900/50 backdrop-blur animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-semibold mb-4 text-green-400 flex items-center gap-2">
              <Zap className="w-4 h-4" /> AI Results
            </h3>
            
            {analysis && (
              <div className="space-y-4 mb-6">
                <div className="p-3 rounded bg-gray-800/50 border border-gray-700">
                  <div className="text-sm text-gray-400">Profile Score</div>
                  <div className="text-2xl font-bold text-white">{analysis.score}/100</div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-300">Strategy Suggestion:</p>
                  <p className="text-sm text-gray-400 italic">{analysis.suggestion}</p>
                </div>
              </div>
            )}

            {generatedReview && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-300">Generated Review:</p>
                <div className="p-4 rounded bg-gray-800/50 border border-gray-700 text-sm text-gray-300 italic">
                  "{generatedReview}"
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => {
                  navigator.clipboard.writeText(generatedReview);
                  toast.success("Copied to clipboard!");
                }}>
                  Copy Review
                </Button>
              </div>
            )}
          </Card>
        )}

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Stats Overview</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Profile Score</span>
              <span className="text-white">{analysis ? analysis.score : "--"}</span>
            </div>
            <div className="flex justify-between">
              <span>Engagement Rate</span>
              <span className="text-white">{analysis ? analysis.engagement : "--"}</span>
            </div>
            <div className="flex justify-between">
              <span>Recommended Boost</span>
              <span className="text-white">{analysis ? analysis.recommendedBoost : "--"}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
