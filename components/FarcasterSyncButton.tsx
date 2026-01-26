'use client';

import React from 'react';
import { useFrame } from './providers/FrameProvider';
import { RefreshCw, User } from 'lucide-react';
import Image from 'next/image';

export function FarcasterSyncButton() {
  const { user, sync } = useFrame();
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await sync();
      // Also sync to our backend
      if (user) {
        await fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fid: user.fid,
            username: user.username,
            displayName: user.displayName,
            pfpUrl: user.pfpUrl
          })
        });
      }
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-xl">
        {user.pfpUrl ? (
          <Image
            src={user.pfpUrl}
            alt={user.username || 'User'}
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
            <User className="w-4 h-4 text-purple-400" />
          </div>
        )}
        <span className="text-sm font-medium text-gray-200">
          {user.username || `!${user.fid}`}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
      <span>{isSyncing ? 'Syncing...' : 'Sync Farcaster'}</span>
    </button>
  );
}
