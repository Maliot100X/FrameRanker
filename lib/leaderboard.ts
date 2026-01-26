/**
 * Leaderboard functionality using server-side API
 * Server handles aggregation and caching (10-minute cache)
 */

export interface LeaderboardEntry {
  id: string; // address or post url or whatever unique id
  address?: string; // for profiles/reviewers
  url?: string; // for posts
  score: number;
  username?: string;
  pfpUrl?: string;
  rank?: number;
}

export interface LeaderboardData {
  topProfiles: LeaderboardEntry[];
  topPosts: LeaderboardEntry[];
  topReviewers: LeaderboardEntry[];
  lastUpdated: number;
}

/**
 * Get leaderboard data from server-side API
 */
export async function getLeaderboardData(forceRefresh = false): Promise<LeaderboardData> {
  try {
    const url = forceRefresh
      ? '/api/leaderboard?forceRefresh=true'
      : '/api/leaderboard';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as LeaderboardData;
  } catch (error) {
    console.error('Failed to fetch leaderboard data:', error);
    
    // Return empty data on error
    return {
      topProfiles: [],
      topPosts: [],
      topReviewers: [],
      lastUpdated: 0
    };
  }
}

/**
 * Get all unique addresses from leaderboard data
 * This is used by the component to fetch profiles using useProfiles hook
 */
export function getLeaderboardAddresses(data: LeaderboardData): string[] {
  const addresses = new Set<string>();
  
  data.topProfiles.forEach(entry => entry.address && addresses.add(entry.address.toLowerCase()));
  data.topReviewers.forEach(entry => entry.address && addresses.add(entry.address.toLowerCase()));
  // Posts might have author addresses if we include them, but for now we stick to profiles/reviewers
  
  return Array.from(addresses);
}
