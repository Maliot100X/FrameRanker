'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Coins, ExternalLink } from 'lucide-react';
import { createPublicClient, http, parseAbi, formatUnits } from 'viem';
import { zora } from 'viem/chains';

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

interface BoostedCoinCardProps {
    coinAddress: string;
}

export function BoostedCoinCard({ coinAddress }: BoostedCoinCardProps) {
    const [name, setName] = useState<string>('');
    const [symbol, setSymbol] = useState<string>('');
    const [supply, setSupply] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [n, s, d, ts] = await Promise.all([
                    publicClient.readContract({ address: coinAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'name' }).catch(() => "Unknown"),
                    publicClient.readContract({ address: coinAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'symbol' }).catch(() => "???"),
                    publicClient.readContract({ address: coinAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' }).catch(() => 18),
                    publicClient.readContract({ address: coinAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'totalSupply' }).catch(() => 0n),
                ]);
                setName(n as string);
                setSymbol(s as string);
                
                const formattedSupply = formatUnits(ts as bigint, d as number);
                // Format nicely (e.g. 1.2M, 100K)
                const numSupply = parseFloat(formattedSupply);
                if (numSupply > 1000000) {
                    setSupply(`${(numSupply / 1000000).toFixed(1)}M`);
                } else if (numSupply > 1000) {
                    setSupply(`${(numSupply / 1000).toFixed(1)}K`);
                } else {
                    setSupply(numSupply.toFixed(0));
                }
            } catch (e) {
                console.error("Failed to fetch coin metadata", e);
                setName("Unknown Coin");
                setSymbol("???");
                setSupply("?");
            } finally {
                setIsLoading(false);
            }
        };
        fetchMetadata();
    }, [coinAddress]);

    if (isLoading) {
        return <div className="h-24 bg-gray-800 rounded-xl animate-pulse" />;
    }

    return (
        <Card className="p-4 border-blue-500/20 bg-blue-500/5 flex items-center justify-between min-w-[200px]">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                    {symbol.substring(0, 3)}
                </div>
                <div>
                    <div className="font-bold text-white text-sm">{name}</div>
                    <div className="flex items-center gap-2 text-xs text-blue-400 font-mono">
                        <span>{symbol}</span>
                        <span className="text-gray-500">•</span>
                        <span>{supply} Supply</span>
                    </div>
                </div>
            </div>
            <a 
                href={`https://explorer.zora.energy/token/${coinAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-blue-500/20 px-3 py-1 rounded-full text-blue-300 hover:bg-blue-500/30 transition-colors"
            >
                View
            </a>
        </Card>
    );
}
