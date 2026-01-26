'use client';

import { useAccount } from 'wagmi';
import { User, Settings, CreditCard, Activity, Zap, Star, RefreshCw, Gift, BarChart3, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/lib/hooks/useNeynar';
import { useFrame } from '@/components/providers/FrameProvider';
import Link from 'next/link';
import Image from 'next/image';

import { FarcasterSyncButton } from '@/components/FarcasterSyncButton';

export default function MorePage() {
  const { address, isConnected } = useAccount();
  const { user: frameUser } = useFrame();
  const { data: profile, isLoading: profileLoading } = useProfile(address);

  // Use frameUser if available, otherwise fallback to fetched profile
  const displayUser = frameUser ? {
    username: frameUser.username,
    pfpUrl: frameUser.pfpUrl,
    displayName: frameUser.displayName,
    fid: frameUser.fid
  } : profile ? {
    username: profile.username,
    pfpUrl: profile.pfp?.url,
    displayName: profile.displayName,
    fid: profile.fid
  } : null;

  if (!isConnected && !frameUser) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gray-800 rounded-full mx-auto flex items-center justify-center">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold">Connect Wallet</h1>
          <p className="text-gray-400">Connect to access your profile settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8">
        {profileLoading && !frameUser ? (
          <div className="w-24 h-24 rounded-full bg-gray-800 animate-pulse mb-4" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-800 mb-4 overflow-hidden relative">
            {displayUser?.pfpUrl ? (
              <Image src={displayUser.pfpUrl} alt="Profile" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <User className="w-10 h-10 text-gray-400" />
              </div>
            )}
          </div>
        )}
        <h1 className="text-2xl font-bold">{displayUser?.username ? `@${displayUser.username}` : 'User'}</h1>
        <p className="text-gray-400 text-sm mb-2">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}</p>
        
        {/* Sync Button */}
        <div className="mt-2">
            <FarcasterSyncButton />
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-3 max-w-md mx-auto">
        <Button variant="outline" className="w-full justify-start h-14 text-lg bg-gray-900/50 border-gray-800" asChild>
          <Link href="/more/activity">
            <Activity className="mr-3 w-5 h-5 text-blue-400" /> 
            My Activity
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start h-14 text-lg bg-gray-900/50 border-gray-800" asChild>
          <Link href="/more/boosts">
            <Zap className="mr-3 w-5 h-5 text-yellow-400" /> 
            My Boosts
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start h-14 text-lg bg-gray-900/50 border-gray-800" asChild>
          <Link href="/more/reviews">
            <Star className="mr-3 w-5 h-5 text-pink-400" /> 
            My Reviews
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start h-14 text-lg bg-gray-900/50 border-gray-800" asChild>
          <Link href="/more/subscription">
            <CreditCard className="mr-3 w-5 h-5 text-green-400" /> 
            Subscription
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start h-14 text-lg bg-gray-900/50 border-gray-800" asChild>
          <Link href="/more/giveaways">
            <Gift className="mr-3 w-5 h-5 text-pink-500" /> 
            Giveaways
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start h-14 text-lg bg-gray-900/50 border-gray-800" asChild>
          <Link href="/more/analytics">
            <BarChart3 className="mr-3 w-5 h-5 text-purple-400" /> 
            Analytics (Pro)
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start h-14 text-lg bg-gray-900/50 border-gray-800" asChild>
          <Link href="/more/settings">
            <Settings className="mr-3 w-5 h-5 text-gray-400" /> 
            Settings
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start h-14 text-lg bg-gray-900/50 border-gray-800" asChild>
          <Link href="/more/docs">
            <BookOpen className="mr-3 w-5 h-5 text-blue-300" /> 
            How it works
          </Link>
        </Button>
      </div>
    </div>
  );
}
