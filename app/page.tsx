'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Zap, TrendingUp, Star, User, Coins } from 'lucide-react';
import Image from 'next/image';
import { FeaturedCoin } from '@/components/FeaturedCoin';
import { BoostedCoinCard } from '@/components/BoostedCoinCard';

interface BoostedProfile {
  id: string;
  user: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
  };
}

interface BoostedPost {
  id: string;
  post: {
    url: string;
    hash: string;
    author: {
        fid: number;
        username: string;
        displayName: string;
        pfpUrl: string;
    }
  };
}

interface BoostedCoin {
  id: string;
  coinAddress: string;
  coinType: string;
}

export default function Home() {
  const [profiles, setProfiles] = useState<BoostedProfile[]>([]);
  const [posts, setPosts] = useState<BoostedPost[]>([]);
  const [coins, setCoins] = useState<BoostedCoin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/home');
        const data = await res.json();
        if (data.boostedProfiles) setProfiles(data.boostedProfiles);
        if (data.boostedPosts) setPosts(data.boostedPosts);
        if (data.boostedCoins) setCoins(data.boostedCoins);
      } catch (error) {
        console.error("Failed to fetch home data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 mb-20 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          FrameRanker
        </h1>
      </div>

      {/* Featured Coin (Zora Integration) */}
      <div className="space-y-4">
        <FeaturedCoin />
        
        {/* Boosted Coins List */}
        {coins.length > 0 && (
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
            {coins.map((coin) => (
              <BoostedCoinCard key={coin.id} coinAddress={coin.coinAddress} />
            ))}
          </div>
        )}
      </div>

      {/* Boosted Profiles */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="text-yellow-500 w-5 h-5" />
          <h2 className="text-xl font-bold">Boosted Profiles</h2>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
          {isLoading ? (
            // Skeletons
            [1, 2, 3].map((i) => (
                <div key={i} className="min-w-[140px] h-32 bg-gray-800 rounded-xl animate-pulse" />
            ))
          ) : profiles.length === 0 ? (
            <p className="text-gray-500 text-sm italic pl-2">No active profile boosts.</p>
          ) : (
            profiles.map((boost) => (
              <Card key={boost.id} className="min-w-[140px] p-4 flex flex-col items-center border-yellow-500/30 bg-yellow-500/5 relative">
                <div className="w-16 h-16 rounded-full bg-gray-700 mb-2 overflow-hidden relative">
                    {boost.user.pfpUrl ? (
                        <Image src={boost.user.pfpUrl} alt={boost.user.username || "User"} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800"><User className="w-8 h-8 text-gray-500"/></div>
                    )}
                </div>
                <span className="font-semibold text-sm truncate w-full text-center">{boost.user.displayName || boost.user.username || `!${boost.user.fid}`}</span>
                <span className="text-xs text-yellow-500 mt-1">Boosted</span>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Boosted Posts */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-pink-500 w-5 h-5" />
          <h2 className="text-xl font-bold">Boosted Posts</h2>
        </div>
        <div className="space-y-4">
            {isLoading ? (
                [1, 2].map((i) => <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />)
            ) : posts.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No active post boosts.</p>
            ) : (
                posts.map((boost) => (
                    <Card key={boost.id} className="p-4 border-pink-500/20 bg-pink-500/5">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden relative">
                                {boost.post.author.pfpUrl ? (
                                    <Image src={boost.post.author.pfpUrl} alt="Author" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-800"><User className="w-5 h-5 text-gray-500"/></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold truncate">
                                        {boost.post.author.displayName || boost.post.author.username}
                                    </span>
                                </div>
                                <p className="text-sm mt-1 text-gray-300 truncate">
                                    {boost.post.url}
                                </p>
                                <div className="mt-2 text-xs text-pink-400 font-medium">
                                    Boosted Post
                                </div>
                            </div>
                        </div>
                    </Card>
                ))
            )}
        </div>
      </section>

      {/* Boosted Coins */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Coins className="text-blue-500 w-5 h-5" />
          <h2 className="text-xl font-bold">Community Boosted Coins</h2>
        </div>
        <div className="space-y-4">
            {isLoading ? (
                [1, 2].map((i) => <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />)
            ) : coins.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No active coin boosts.</p>
            ) : (
                coins.map((boost) => (
                    <BoostedCoinCard key={boost.id} coinAddress={boost.coinAddress} />
                ))
            )}
        </div>
      </section>

      {/* Trending (Organic) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Star className="text-purple-500 w-5 h-5" />
          <h2 className="text-xl font-bold">Trending</h2>
        </div>
        <div className="space-y-4">
          <p className="text-gray-400 text-sm italic">Coming soon based on organic engagement...</p>
        </div>
      </section>
    </div>
  );
}
