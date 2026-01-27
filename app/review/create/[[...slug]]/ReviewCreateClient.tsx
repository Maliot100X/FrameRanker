"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useAccount, useChainId, useSwitchChain, useSendTransaction } from "wagmi";
import { base } from "wagmi/chains";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  fetchProfileByUsername,
  fetchProfileByFid,
  getPrimaryWallet,
  fetchProfileByWallet,
  fetchProfilesByWallets,
  type NeynarUser,
} from "@/lib/neynar";
import { sdk } from "@/lib/miniapp";
import { getLeaderboardData } from "@/lib/leaderboard";
import { parseEther } from "viem";
import { toast } from "sonner";
import { useFrame } from "@/components/providers/FrameProvider";

const PAYMENT_RECEIVER = process.env.NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS || "0xCcD1E099590bfEdf279e239558772Bbb50902EF6";
const REVIEW_PRICE = "0.001"; // Approx $2-3

const EMOJI_OPTIONS = [
  { value: 5, emoji: "❤️", label: "Love & appreciation" },
  { value: 4, emoji: "🔥", label: "Amazing & inspiring" },
  { value: 3, emoji: "💎", label: "Valuable & insightful" },
  { value: 2, emoji: "🤝", label: "Respect & agreement" },
  { value: 1, emoji: "🤔", label: "Reflective & critical" },
];

const MAX_CONTENT_LENGTH = 145;

export default function ReviewCreateClient() {
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { user } = useFrame();
  const searchParams = useSearchParams();
  const params = useParams();
  const queryClient = useQueryClient();
  const { sendTransactionAsync } = useSendTransaction();

  // Check if on correct network
  const isCorrectNetwork = chainId === base.id;

  // Search state
  const [username, setUsername] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Reviewee data
  const [reviewee, setReviewee] = useState<
    (NeynarUser & { wallet: string }) | null
  >(null);
  
  // Self-review prevention
  const isSelfReview = reviewee && userAddress && 
    reviewee.wallet.toLowerCase() === userAddress.toLowerCase();

  // Recent reviewees state
  const [recentReviewees, setRecentReviewees] = useState<
    (NeynarUser & { wallet: string })[]
  >([]);
  const [loadingRecentReviewees, setLoadingRecentReviewees] = useState(false);

  // Review form state
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null);
  const [content, setContent] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [submittedReviewId, setSubmittedReviewId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Load reviewee profile by wallet address
  const loadRevieweeByAddress = async (address: string) => {
    setSearching(true);
    setSearchError("");

    try {
      const user = await fetchProfileByWallet(address as `0x${string}`);

      if (!user) {
        throw new Error("User not found");
      }

      // Get wallet address
      const wallet = getPrimaryWallet(user);
      if (!wallet) {
        throw new Error("User has no verified Ethereum address");
      }

      setReviewee({
        ...user,
        wallet: wallet,
      });
    } catch (err: any) {
      setSearchError(err.message || "Failed to load user profile");
    } finally {
      setSearching(false);
    }
  };

  // Load reviewee profile by FID (for Share Extension)
  const loadRevieweeByFid = async (fid: number) => {
    setSearching(true);
    setSearchError("");

    try {
      const user = await fetchProfileByFid(fid);

      if (!user) {
        throw new Error("User not found");
      }

      // Get wallet address
      const wallet = getPrimaryWallet(user);
      if (!wallet) {
        throw new Error("User has no verified Ethereum address");
      }

      setReviewee({
        ...user,
        wallet: wallet,
      });
    } catch (err: any) {
      setSearchError(err.message || "Failed to load user profile");
    } finally {
      setSearching(false);
    }
  };

  // Load trending reviewees on mount (from leaderboard data)
  useEffect(() => {
    const loadTrendingReviewees = async () => {
      // Don't load if user is searching or has selected a reviewee
      if (searching || reviewee || username.trim()) return;

      setLoadingRecentReviewees(true);
      try {
        // Get leaderboard data (uses 10-minute server cache)
        const leaderboardData = await getLeaderboardData();

        if (leaderboardData.topProfiles.length === 0) {
          setRecentReviewees([]);
          return;
        }

        // Shuffle and pick random 10 from top profiles
        const shuffled = [...leaderboardData.topProfiles]
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);

        const revieweeAddresses = shuffled
          .map((entry) => entry.address)
          .filter((addr): addr is string => !!addr);

        // Fetch profiles in batch (single API call)
        const profiles = await fetchProfilesByWallets(revieweeAddresses);

        // Convert to reviewee list with primary wallet
        const revieweeList = revieweeAddresses
          .map((addr) => {
            const profile = profiles[addr.toLowerCase()];
            if (!profile) return null;

            const wallet = getPrimaryWallet(profile);
            if (!wallet) return null;

            return {
              ...profile,
              wallet,
            };
          })
          .filter(
            (item): item is NeynarUser & { wallet: string } => item !== null
          );

        setRecentReviewees(revieweeList);
      } catch (err) {
        console.error("Failed to load trending reviewees:", err);
        setRecentReviewees([]);
      } finally {
        setLoadingRecentReviewees(false);
      }
    };

    loadTrendingReviewees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Auto-load reviewee from URL slug (username)
  useEffect(() => {
    if (params?.slug && Array.isArray(params.slug) && params.slug.length > 0) {
      const targetUsername = params.slug[0];
      // Only search if we haven't already found the user or if the username in URL is different
      if (
        targetUsername &&
        (!reviewee ||
          reviewee.username.toLowerCase() !== targetUsername.toLowerCase())
      ) {
        setUsername(targetUsername);
        handleSearch(targetUsername);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Auto-load reviewee from query parameter (wallet address)
  useEffect(() => {
    const revieweeAddress = searchParams.get("reviewee");
    if (revieweeAddress && !reviewee) {
      loadRevieweeByAddress(revieweeAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Auto-load reviewee from castFid (Share Extension URL parameter)
  useEffect(() => {
    const castFid = searchParams.get("castFid");
    if (castFid && !reviewee) {
      loadRevieweeByFid(parseInt(castFid, 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Handle Share Extension SDK context (enriched cast data)
  useEffect(() => {
    const handleShareContext = async () => {
      try {
        const context = await sdk.context;
        if (context?.location?.type === "cast_share" && !reviewee) {
          const cast = (context.location as any).cast;
          if (cast?.author) {
            // Use enriched author data from SDK
            const authorFid = cast.author.fid;
            if (authorFid) {
              loadRevieweeByFid(authorFid);
            }
          }
        }
      } catch (error) {
        console.error("Failed to get SDK context for share extension:", error);
      }
    };

    handleShareContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search for user
  const handleSearch = async (usernameOverride?: string) => {
    const targetUsername =
      typeof usernameOverride === "string" ? usernameOverride : username;

    if (!targetUsername.trim()) return;

    setSearching(true);
    setSearchError("");
    setReviewee(null);

    try {
      const trimmedUsername = targetUsername.trim();
      const hadEthSuffix = trimmedUsername.toLowerCase().endsWith(".eth");
      const usernameWithoutEth = trimmedUsername.replace(/\.eth$/i, "");

      let user: NeynarUser | null = null;

      // Try the exact username first (including .eth if provided)
      try {
        user = await fetchProfileByUsername(trimmedUsername);
      } catch (err) {
        // Continue to try alternatives
      }

      // If not found and had .eth suffix, try without it
      if (!user && hadEthSuffix) {
        try {
          user = await fetchProfileByUsername(usernameWithoutEth);
        } catch (err) {
          // Continue to try alternatives
        }
      }

      // If not found and didn't have .eth suffix, try with it
      if (!user && !hadEthSuffix) {
        try {
          user = await fetchProfileByUsername(`${usernameWithoutEth}.eth`);
        } catch (err) {
          // All attempts failed
        }
      }

      if (!user) {
        throw new Error("User not found");
      }

      // Get wallet address
      const wallet = getPrimaryWallet(user);
      if (!wallet) {
        throw new Error("User has no verified Ethereum address");
      }

      setReviewee({
        ...user,
        wallet: wallet,
      });

    } catch (err: any) {
      setSearchError(err.message || "Failed to find user");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    // Check if on Base network
    if (!isCorrectNetwork) {
      try {
        await switchChain?.({ chainId: base.id });
      } catch (err: any) {
        setError("Please switch to Base network to continue");
        return;
      }
    }

    if (!reviewee || !selectedEmoji || !content) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (isSelfReview) {
      toast.error("You cannot review yourself");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // 1. Send Payment (ETH)
      const hash = await sendTransactionAsync({
        to: PAYMENT_RECEIVER as `0x${string}`,
        value: parseEther(REVIEW_PRICE),
      });

      setTxHash(hash);
      toast.success("Payment sent! Creating review...");

      // 2. Submit to API
      const response = await fetch("/api/reviews/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerFid: user?.fid,
          targetFid: reviewee.fid,
          content,
          rating: selectedEmoji,
          txHash: hash,
          reviewerAddress: userAddress,
          targetAddress: reviewee.wallet,
          reviewerUsername: user?.username || "Anonymous",
          targetUsername: reviewee.username,
          reviewerPfp: user?.pfpUrl,
          targetPfp: reviewee.pfp.url
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create review");
      }

      const data = await response.json();
      setSubmittedReviewId(data.reviewId);
      setSuccess(true);
      toast.success("Review created successfully!");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["recentReviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviewsForWallet"] });

    } catch (err: any) {
      console.error("Review submission failed:", err);
      setError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setReviewee(null);
    setUsername("");
    setSelectedEmoji(null);
    setContent("");
    setError("");
    setSuccess(false);
    setTxHash("");
    setSubmittedReviewId(null);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-700/50 max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="h-10 w-10 text-green-400" />
          </motion.div>
          <h2 className="text-white text-2xl font-semibold mb-3">
            Review Submitted! 🎉
          </h2>
          <p className="text-gray-400 mb-2">
            Your review has been recorded
          </p>
          {txHash && (
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 text-sm hover:underline"
            >
              View on BaseScan →
            </a>
          )}
          <div className="mt-8 flex flex-col gap-3">
            {submittedReviewId !== null && (
              <Link href={`/review/${submittedReviewId}`} className="w-full">
                <Button className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-xl h-12">
                  View Review Post
                </Button>
              </Link>
            )}
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full rounded-xl h-12"
            >
              Write Another Review
            </Button>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full rounded-xl h-12">
                Back to Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-6 pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-white text-3xl font-bold mb-2">Write a Review</h1>
          <p className="text-gray-400 text-sm">
            Share your authentic feedback and earn Points
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label className="text-white text-sm font-medium mb-3 block">
            Who do you want to review?
          </label>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 rounded-xl h-12 pr-24"
                disabled={searching}
              />
              <Button
                onClick={() => handleSearch()}
                disabled={searching || !username.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg h-8 px-3 flex items-center gap-1.5 text-sm font-medium"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </Button>
            </div>

            {searchError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {searchError}
              </motion.div>
            )}

            {/* Recent Reviewees List */}
            {!reviewee && !searching && !username.trim() && (
              <AnimatePresence>
                {recentReviewees.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4"
                  >
                    <div className="text-gray-400 text-xs mb-2 px-1">
                      Trending reviewees
                    </div>
                    <div className="space-y-2">
                      {loadingRecentReviewees ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        recentReviewees.map((user) => (
                          <motion.button
                            key={user.fid}
                            onClick={() => {
                              setReviewee(user);
                            }}
                            className="w-full flex items-center gap-3 p-3 bg-gray-900/50 hover:bg-gray-900/70 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all text-left"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <img
                              src={user.pfp?.url || "/default-avatar.png"}
                              alt={user.displayName}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium text-sm truncate">
                                {user.displayName}
                              </div>
                              <div className="text-gray-400 text-xs truncate">
                                @{user.username}
                              </div>
                            </div>
                          </motion.button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {reviewee && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl border ${
                  isSelfReview ? 'border-red-500/50' : 'border-gray-700/50'
                }`}
              >
                <img
                  src={reviewee.pfp?.url || "/default-avatar.png"}
                  alt={reviewee.displayName}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {reviewee.displayName}
                  </div>
                  <div className="text-gray-400 text-sm">
                    @{reviewee.username}
                  </div>
                  {isSelfReview && (
                    <div className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Cannot review yourself
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  Change
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Review Form */}
        <AnimatePresence>
          {reviewee && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Emoji Selection */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <label className="text-white text-sm font-medium mb-4 block">
                  Choose your emotion:
                </label>
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {EMOJI_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedEmoji(option.value)}
                      className={`
                        flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all
                        ${
                          selectedEmoji === option.value
                            ? "border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/20"
                            : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                        }
                      `}
                    >
                      <span className="text-3xl">{option.emoji}</span>
                    </button>
                  ))}
                </div>
                {/* Selected emoji description */}
                {selectedEmoji && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4 border-t border-gray-700/50"
                  >
                    <p className="text-pink-400 text-sm font-medium text-center">
                      {
                        EMOJI_OPTIONS.find((opt) => opt.value === selectedEmoji)
                          ?.label
                      }
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Review Text */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-white text-sm font-medium">
                    Write your review
                  </label>
                  <span
                    className={`text-xs ${
                      content.length > MAX_CONTENT_LENGTH
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    {content.length}/{MAX_CONTENT_LENGTH}
                  </span>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your honest feedback..."
                  className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 rounded-xl min-h-[120px] resize-none"
                  maxLength={MAX_CONTENT_LENGTH + 50}
                />
              </div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={submitting || !selectedEmoji || !content.trim() || isSelfReview || content.length > MAX_CONTENT_LENGTH}
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-xl h-14 text-lg font-medium shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Pay ${REVIEW_PRICE} ETH & Post Review`
                )}
              </Button>
              
              <p className="text-center text-xs text-gray-500 mt-2">
                10 Points awarded for every review
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}