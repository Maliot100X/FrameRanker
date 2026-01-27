/**
 * Client-side React hooks for Review fetching
 * Uses React Query and API routes (migrated from on-chain)
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { type Review } from '@/lib/types';
import {
  getCachedTxHash,
  setCachedTxHash,
} from '@/lib/cache';

// ==================== useReview Hook ====================

export function useReview(reviewId: string | number, options?: { initialData?: Review }) {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: async () => {
      // Always fetch from API route for DB-based reviews
      const response = await fetch(`/api/reviews/${reviewId}`);
      if (!response.ok) throw new Error('Failed to fetch review');
      const data = await response.json();
      
      return {
        reviewer: data.reviewer,
        reviewee: data.reviewee,
        content: data.content,
        emoji: data.emoji,
        timestamp: BigInt(new Date(data.timestamp).getTime() / 1000), // Convert ISO string to unix timestamp bigint
        reviewId: data.reviewId,
      } as Review;
    },
    initialData: options?.initialData,
    enabled: !!reviewId
  });
}

// ==================== useReviewsForWallet Hook ====================

export function useReviewsForWallet(walletAddress: `0x${string}`) {
  return useQuery({
    queryKey: ['reviewsForWallet', walletAddress],
    queryFn: async () => {
       const response = await fetch(`/api/reviews/user/${walletAddress}`);
       if (!response.ok) throw new Error('Failed to fetch user reviews');
       const data = await response.json();
       
       // Handle both array and object response formats
       const reviews = Array.isArray(data) ? data : data.reviews || [];
       
       return reviews.map((r: any) => ({
         reviewer: r.reviewerAddress || r.reviewer,
         reviewee: r.targetAddress || r.reviewee,
         content: r.content,
         emoji: r.rating || r.emoji,
         timestamp: BigInt(new Date(r.createdAt || r.timestamp).getTime() / 1000),
         reviewId: r.reviewId || r.id
       })) as Review[];
    },
    enabled: !!walletAddress
  });
}

// ==================== useRecentReviews Hook ====================

export function useRecentReviews(limit: number = 10) {
  return useQuery({
    queryKey: ['recentReviews', limit],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/recent?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch recent reviews');
      const data = await response.json();
      
      // Handle both array and object response formats
      const reviews = Array.isArray(data) ? data : data.reviews || [];
      
      return reviews.map((r: any) => ({
        reviewer: r.reviewerAddress || r.reviewer,
        reviewee: r.targetAddress || r.reviewee,
        content: r.content,
        emoji: r.rating || r.emoji,
        timestamp: BigInt(new Date(r.createdAt || r.timestamp).getTime() / 1000),
        reviewId: r.reviewId || r.id
      })) as Review[];
    }
  });
}

// ==================== useReviewsByReviewer Hook ====================

export function useReviewsByReviewer(reviewer: `0x${string}`) {
  return useQuery({
    queryKey: ['reviewsByReviewer', reviewer],
    queryFn: async () => {
      console.log(`[useReviewsByReviewer] Fetching reviews by reviewer: ${reviewer}`);

      const response = await fetch(`/api/reviews/reviewer/${reviewer}`);
      if (!response.ok) throw new Error('Failed to fetch reviews by reviewer');
      const data = await response.json();
      
      const reviews = (data.reviews || []).map((r: any) => ({
        reviewer: r.reviewer,
        reviewee: r.reviewee,
        content: r.content,
        emoji: r.emoji,
        timestamp: BigInt(new Date(r.timestamp).getTime() / 1000),
        reviewId: r.reviewId,
      })) as Review[];

      console.log(`[useReviewsByReviewer] ✅ Fetched ${reviews.length} reviews by reviewer ${reviewer}`);
      return reviews;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// ==================== useTxHash Hook ====================

export function useTxHash(reviewId: number | string) {
  return useQuery({
    queryKey: ['txHash', reviewId],
    queryFn: async () => {
      // 1. Check cache first
      const cached = getCachedTxHash(reviewId);
      if (cached) {
        console.log(`[useTxHash] 💾 Cache hit: reviewId ${reviewId}`);
        return cached;
      }

      // 2. Try API route
      try {
        const response = await fetch('/api/reviews/tx-hashes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewIds: [reviewId] }),
        });
        
        if (response.ok) {
          const data = await response.json();
          const txHash = data.txHashes?.[reviewId] || null;
          
          // Cache result if found
          if (txHash) {
            setCachedTxHash(reviewId, txHash);
            console.log(`[useTxHash] ✅ Found via API route: reviewId ${reviewId}`);
          }
          
          return txHash;
        }
      } catch (error) {
        console.error(`[useTxHash] ⚠️ API route failed for reviewId ${reviewId}:`, error);
      }

      return null;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
}
