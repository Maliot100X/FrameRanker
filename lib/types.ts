export interface Review {
  reviewer: `0x${string}`;
  reviewee: `0x${string}`;
  content: string;
  emoji: number; // 1-5
  timestamp: bigint;
  reviewId?: number | string; 
}
