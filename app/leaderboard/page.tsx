"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Medal, Loader2, RefreshCw, Zap, Gift, Coins, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getLeaderboardData,
  getLeaderboardAddresses,
  type LeaderboardEntry,
} from "@/lib/leaderboard";
import { useProfiles } from "@/lib/hooks/useNeynar";
import { formatAddress } from "@/lib/neynar";
import Link from "next/link";
import Image from "next/image";

// Placeholder for Coin Leaderboard since we don't have real data yet
const MOCK_COIN_LEADERBOARD: LeaderboardEntry[] = [
    { id: "1", username: "Zora Coin", score: 1500, pfpUrl: "https://zora.co/favicon.ico", url: "https://zora.co" },
    { id: "2", username: "Base Coin", score: 1200, pfpUrl: "https://base.org/favicon.ico", url: "https://base.org" },
    { id: "3", username: "Degen", score: 900, pfpUrl: "https://degen.tips/favicon.ico", url: "https://degen.tips" },
];

function GiveawayTimer() {
    const [timeLeft, setTimeLeft] = useState("");
    
    useEffect(() => {
        // Calculate time until next Friday 12:00 PM UTC
        const calculateTimeLeft = () => {
            const now = new Date();
            const nextFriday = new Date();
            nextFriday.setUTCDate(now.getUTCDate() + ((5 - now.getUTCDay() + 7) % 7));
            nextFriday.setUTCHours(12, 0, 0, 0);
            
            if (nextFriday <= now) {
                nextFriday.setUTCDate(nextFriday.getUTCDate() + 7);
            }
            
            const diff = nextFriday.getTime() - now.getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        };
        
        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 60000);
        return () => clearInterval(interval);
    }, []);
    
    return (
        <Card className="mb-6 p-4 bg-gradient-to-r from-pink-900/50 to-purple-900/50 border-pink-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <Gift className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                    <h3 className="font-bold text-white">Weekly Giveaway</h3>
                    <p className="text-xs text-pink-300">Top 3 rankers win prizes!</p>
                </div>
            </div>
            <div className="text-right">
                <div className="text-sm text-gray-400">Next Drop</div>
                <div className="font-mono font-bold text-lg text-white">{timeLeft}</div>
            </div>
        </Card>
    );
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"profiles" | "posts" | "reviewers" | "coins">("profiles");
  const [topProfiles, setTopProfiles] = useState<LeaderboardEntry[]>([]);
  const [topPosts, setTopPosts] = useState<LeaderboardEntry[]>([]);
  const [topReviewers, setTopReviewers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [error, setError] = useState("");
  const [allAddresses, setAllAddresses] = useState<string[]>([]);

  // Fetch profiles using the shared useProfiles hook (with IndexedDB caching)
  const { data: profiles, isLoading: profilesLoading } =
    useProfiles(allAddresses);

  const loadLeaderboard = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getLeaderboardData(forceRefresh);

      setTopProfiles(data.topProfiles);
      setTopPosts(data.topPosts);
      setTopReviewers(data.topReviewers);
      setLastUpdated(data.lastUpdated);

      // Get all unique addresses for profile fetching
      setAllAddresses(getLeaderboardAddresses(data));
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
      setError("Failed to load leaderboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const handleRefresh = () => {
    loadLeaderboard(true);
  };

  // Enrich entries with profile data from useProfiles
  const enrichWithProfiles = (
    entries: LeaderboardEntry[]
  ): LeaderboardEntry[] => {
    if (!profiles) return entries;

    return entries.map((entry) => {
      if (!entry.address) return entry;
      const profile = profiles[entry.address.toLowerCase()];
      return {
        ...entry,
        username: profile?.username,
        pfpUrl: profile?.pfp?.url,
      };
    });
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case "profiles":
        return enrichWithProfiles(topProfiles);
      case "posts":
        return topPosts; // Posts don't need profile enrichment in the same way, or handled differently
      case "reviewers":
        return enrichWithProfiles(topReviewers);
      case "coins":
        return MOCK_COIN_LEADERBOARD;
      default:
        return [];
    }
  };

  const currentData = getCurrentData();

  // Get medal emoji for top 3
  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 0:
        return <span className="text-2xl">🥇</span>;
      case 1:
        return <span className="text-2xl">🥈</span>;
      case 2:
        return <span className="text-2xl">🥉</span>;
      default:
        return <span className="text-gray-500 font-bold w-6 text-center">{rank + 1}</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 mb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
          <Trophy className="text-yellow-500" />
          Leaderboard
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className={refreshing ? "animate-spin" : ""}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      
      <GiveawayTimer />

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        <Button
          variant={activeTab === "profiles" ? "default" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("profiles")}
          className="whitespace-nowrap"
        >
          <Zap className="w-4 h-4 mr-1" /> Profiles
        </Button>
        <Button
          variant={activeTab === "posts" ? "default" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("posts")}
          className="whitespace-nowrap"
        >
          <TrendingUp className="w-4 h-4 mr-1" /> Posts
        </Button>
        <Button
          variant={activeTab === "reviewers" ? "default" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("reviewers")}
          className="whitespace-nowrap"
        >
          <Star className="w-4 h-4 mr-1" /> Reviewers
        </Button>
        <Button
          variant={activeTab === "coins" ? "default" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("coins")}
          className="whitespace-nowrap"
        >
          <Coins className="w-4 h-4 mr-1" /> Coins
        </Button>
      </div>

      {loading && !refreshing ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">{error}</div>
      ) : currentData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No data available yet. Be the first to join!
        </div>
      ) : (
        <div className="space-y-3">
          {currentData.map((entry, index) => (
            <motion.div
              key={entry.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`p-4 flex items-center gap-4 ${index < 3 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-gray-800 bg-gray-900/50'}`}>
                <div className="w-8 flex justify-center">{getMedalEmoji(index)}</div>
                
                <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden relative flex-shrink-0">
                  {entry.pfpUrl ? (
                    <Image
                      src={entry.pfpUrl}
                      alt={entry.username || "User"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <Zap className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">
                    {entry.username ? `@${entry.username}` : entry.url ? "Post" : "User"}
                  </div>
                  {entry.url && (
                    <div className="text-xs text-gray-500 truncate">{entry.url}</div>
                  )}
                </div>

                <div className="text-right">
                  <div className="font-bold text-lg text-pink-500">
                    {entry.score}
                  </div>
                  <div className="text-xs text-gray-500">pts</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
