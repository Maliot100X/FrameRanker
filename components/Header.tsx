'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import { Trophy, User, Plus, Zap, Bot, MoreHorizontal } from 'lucide-react';
import { FarcasterSyncButton } from './FarcasterSyncButton';

export function Header() {
  const pathname = usePathname();
  
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };
  
  return (
    <header className="sticky top-0 z-50 bg-gray-900 backdrop-blur-lg border-b border-pink-500/10">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* <Image src="/logo.png" alt="FrameRanker" width={32} height={32} className="rounded-sm" /> */}
          <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-white text-lg font-semibold" style={{ fontFamily: "'Poetsen One', cursive" }}>FrameRanker</h1>
        </Link>
        
        <div className="flex items-center gap-3">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Link 
              href="/boost"
              className={`relative flex items-center gap-2 px-3 py-2 h-10 rounded-lg transition-colors border ${
                isActive('/boost')
                  ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Boost</span>
            </Link>
            
            <Link 
              href="/ai"
              className={`relative flex items-center gap-2 px-3 py-2 h-10 rounded-lg transition-colors border ${
                isActive('/ai')
                  ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm font-medium">AI</span>
            </Link>
            
            <Link 
              href="/leaderboard"
              className={`flex items-center gap-2 px-3 py-2 h-10 rounded-lg transition-colors border ${
                isActive('/leaderboard')
                  ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Leaderboard</span>
            </Link>
            
            <Link 
              href="/more"
              className={`flex items-center gap-2 px-3 py-2 h-10 rounded-lg transition-colors border ${
                isActive('/more')
                  ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="text-sm font-medium">More</span>
            </Link>
          </nav>
          
          {/* Write Review Button */}
          <Link 
            href="/review/create"
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors border ${
              isActive('/review/create')
                ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
            title="Write a Review"
          >
            <Plus className="w-5 h-5" />
          </Link>
          
          <FarcasterSyncButton />
          
          {/* Custom Connect Button */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="h-10 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg shadow-pink-500/20"
                        >
                          <span className="md:hidden">Connect</span>
                          <span className="hidden md:inline">Connect Wallet</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="h-10 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg shadow-pink-500/20 truncate max-w-[120px] md:max-w-none"
                      >
                        {account.displayName}
                      </button>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}

