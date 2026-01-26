"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Medal, Loader2, RefreshCw, Zap } from "lucide-react";
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

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"profiles" | "posts" | "reviewers">("profiles");
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
      default:
        return [];
    }
  };

  const currentData = getCurrentData();

  // Get medal emoji for top 3
  const getMedalEmoji = (rank: number) => {
    if (rank === 0) return "🥇";
    if (rank === 1) return "🥈";
    if (rank === 2) return "🥉";
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 pb-24 md:pb-8">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
            <p className="text-gray-400">Top performers on FrameRanker</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-800/50 rounded-xl mt-8 border border-gray-700/50">
          <button
            onClick={() => setActiveTab("profiles")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "profiles"
                ? "bg-gray-700 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Profiles
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "posts"
                ? "bg-gray-700 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("reviewers")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "reviewers"
                ? "bg-gray-700 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Reviewers
          </button>
        </div>
      </div>

      {/* List */}
      <div className="px-4 max-w-2xl mx-auto space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-4" />
            <p className="text-gray-400">Loading rankings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={() => loadLeaderboard(true)} variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentData.map((entry, index) => (
              <motion.div
                key={entry.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 flex items-center gap-4 bg-gray-900/50 border-gray-800 hover:border-pink-500/30 transition-colors">
                  <div className="w-8 text-center font-bold text-lg text-gray-500">
                    {getMedalEmoji(index) || `#${index + 1}`}
                  </div>
                  
                  {activeTab === "posts" ? (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                         <div className="w-8 h-8 rounded bg-gray-700 flex-shrink-0" />
                         <div className="truncate text-sm text-blue-400">{entry.url}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        <span>Score: {entry.score}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        {entry.pfpUrl ? (
                          <Image
                            src={entry.pfpUrl}
                            alt={entry.username || "User"}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                            <span className="text-xs">?</span>
                          </div>
                        )}
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] text-black font-bold border border-gray-900">
                            ★
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">
                          {entry.username ? `@${entry.username}` : formatAddress(entry.address || "")}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Zap className="w-3 h-3 text-yellow-500" />
                          <span>Score: {entry.score}</span>
                        </div>
                      </div>
                    </>
                  )}

                  <Button variant="ghost" size="sm" className="ml-auto text-pink-400 hover:text-pink-300">
                    View
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Last Updated */}
      <div className="text-center mt-8 text-xs text-gray-500 flex items-center justify-center gap-2">
        <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className={refreshing ? "animate-spin" : ""}
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
