'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, ExternalLink, TrendingUp, DollarSign, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { createPublicClient, http, parseAbi, formatUnits } from 'viem';
import { zora } from 'viem/chains';
import { PAYMENT_TOKENS } from '@/config/tokens';

const FRAME_RANKER_TOKEN = PAYMENT_TOKENS.FRAME.address;
const ERC20_ABI = parseAbi([
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)"
]);

const publicClient = createPublicClient({
    chain: zora,
    transport: http()
});

interface CoinData {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
}

export function FeaturedCoin() {
    const [coinData, setCoinData] = useState<CoinData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!FRAME_RANKER_TOKEN || (FRAME_RANKER_TOKEN as string) === "") {
            setIsLoading(false);
            return;
        }

        const fetchCoin = async () => {
            try {
                const [name, symbol, decimals, totalSupply] = await Promise.all([
                    publicClient.readContract({ address: FRAME_RANKER_TOKEN as `0x${string}`, abi: ERC20_ABI, functionName: 'name' }).catch(() => "Unknown"),
                    publicClient.readContract({ address: FRAME_RANKER_TOKEN as `0x${string}`, abi: ERC20_ABI, functionName: 'symbol' }).catch(() => "???"),
                    publicClient.readContract({ address: FRAME_RANKER_TOKEN as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' }).catch(() => 18),
                    publicClient.readContract({ address: FRAME_RANKER_TOKEN as `0x${string}`, abi: ERC20_ABI, functionName: 'totalSupply' }).catch(() => 0n),
                ]);

                setCoinData({
                    name: name as string,
                    symbol: symbol as string,
                    decimals: decimals as number,
                    totalSupply: formatUnits(totalSupply as bigint, decimals as number)
                });
            } catch (error) {
                console.error("Failed to fetch featured coin:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCoin();
    }, []);

    if (!FRAME_RANKER_TOKEN || (!isLoading && !coinData)) return null;

    return (
        <section className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
                <Coins className="text-blue-500 w-5 h-5" />
                <h2 className="text-xl font-bold">Featured Coin</h2>
            </div>
            
            <Card className="p-6 border-blue-500/30 bg-gradient-to-r from-blue-900/20 to-purple-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Coins className="w-32 h-32" />
                </div>
                
                {isLoading ? (
                    <div className="animate-pulse space-y-3">
                        <div className="h-8 bg-gray-700 rounded w-1/3" />
                        <div className="h-4 bg-gray-700 rounded w-1/4" />
                    </div>
                ) : (
                    <div className="relative z-10">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">{coinData?.name}</h3>
                                <div className="flex items-center gap-2 text-blue-300 font-mono">
                                    <span className="bg-blue-500/20 px-2 py-0.5 rounded text-sm font-bold">{coinData?.symbol}</span>
                                    <span className="text-xs opacity-70 truncate max-w-[150px]">{FRAME_RANKER_TOKEN}</span>
                                </div>
                            </div>
                            <Link 
                                href={`https://basescan.org/token/${FRAME_RANKER_TOKEN}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-full transition-colors"
                            >
                                <ExternalLink className="w-5 h-5 text-blue-300" />
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-blue-950/30 p-3 rounded-lg border border-blue-500/10">
                                <div className="text-xs text-blue-200/70 mb-1">Total Supply</div>
                                <div className="font-mono text-lg font-bold text-white">
                                    {parseInt(coinData?.totalSupply || "0").toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-blue-950/30 p-3 rounded-lg border border-blue-500/10">
                                <div className="text-xs text-blue-200/70 mb-1">Price</div>
                                <div className="font-mono text-lg font-bold text-white flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4 text-green-400" />
                                    <span>$0.01</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <Button 
                                variant="default" 
                                className="bg-green-600 hover:bg-green-700 text-white w-full"
                                disabled
                                title="Trading coming soon"
                            >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Buy
                            </Button>
                            <Button 
                                variant="outline" 
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 w-full"
                                disabled
                                title="Trading coming soon"
                            >
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                Sell
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </section>
    );
}
