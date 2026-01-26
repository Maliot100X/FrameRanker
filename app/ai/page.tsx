"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccount, useSendTransaction } from "wagmi";
import { parseEther } from "viem";
import { Loader2, Bot, Send, Sparkles, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useFrame } from "@/components/providers/FrameProvider";

interface Message {
  role: "user" | "assistant";
  content: string;
  action?: {
    type: "BOOST" | "REVIEW";
    label: string;
    price: string;
    description: string;
  };
}

const PAYMENT_RECEIVER = process.env.NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS || "0xYourTreasuryAddressHere";

export default function AIPage() {
  const { isConnected, address } = useAccount();
  const { user } = useFrame();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your FrameRanker AI Assistant. I can help you analyze your profile, suggest the best boosting strategy, or generate reviews. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sendTransactionAsync } = useSendTransaction();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          fid: user?.fid,
          username: user?.username,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to get AI response");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          action: data.action,
        },
      ]);
    } catch (error) {
      console.error("AI Chat error:", error);
      toast.error("Failed to get response from AI");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: NonNullable<Message["action"]>) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const hash = await sendTransactionAsync({
        to: PAYMENT_RECEIVER as `0x${string}`,
        value: parseEther(action.price),
      });

      toast.success("Payment sent! Processing action...");
      
      // Notify backend about the action
      await fetch("/api/ai/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: action.type,
          txHash: hash,
          fid: user?.fid,
        }),
      });

      toast.success("Action completed successfully!");
    } catch (error) {
      console.error("Action failed:", error);
      toast.error("Action failed or was rejected");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur z-10">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-400" />
          AI Assistant
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-100"
              }`}
            >
              <div className="flex items-start gap-2">
                {msg.role === "assistant" && <Bot className="w-4 h-4 mt-1 shrink-0 text-blue-400" />}
                <div>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.action && (
                    <div className="mt-3 p-3 bg-gray-900/50 rounded border border-blue-500/30">
                      <p className="font-semibold text-sm mb-1">{msg.action.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">Cost: {msg.action.price} ETH</span>
                        <Button 
                          size="sm" 
                          onClick={() => handleAction(msg.action!)}
                          className="bg-blue-500 hover:bg-blue-600 text-xs h-8"
                        >
                          Confirm & Pay
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about ranking, boosts, or request a review..."
            className="bg-gray-800 border-gray-700"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}