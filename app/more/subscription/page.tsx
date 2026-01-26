'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { Check, Zap, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useFrame } from '@/components/providers/FrameProvider';

const PAYMENT_RECEIVER = process.env.NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS || "0xYourTreasuryAddressHere";

export default function SubscriptionPage() {
  const { isConnected } = useAccount();
  const { user } = useFrame();
  const { sendTransactionAsync } = useSendTransaction();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (user?.fid) {
        fetch(`/api/subscription/status?fid=${user.fid}`)
            .then(res => res.json())
            .then(data => {
                if (data.isSubscribed) {
                    setSubscription(data.subscription);
                }
            })
            .catch(console.error);
    }
  }, [user?.fid]);

  const handleSubscribe = async (plan: 'trial' | 'monthly') => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!user) {
        toast.error("Please sync Farcaster profile first");
        return;
    }

    setIsProcessing(plan);
    const price = plan === 'trial' ? '0.0004' : '0.006'; // $1 vs $15

    try {
      // 1. Send Payment
      const hash = await sendTransactionAsync({
        to: PAYMENT_RECEIVER as `0x${string}`,
        value: parseEther(price),
      });

      toast.info("Payment sent! Activating subscription...");

      // 2. Call API
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          txHash: hash,
          fid: user.fid,
        }),
      });

      if (!response.ok) throw new Error("Failed to activate subscription");

      toast.success("Subscription activated successfully!");

    } catch (error) {
      console.error("Subscription failed:", error);
      toast.error("Subscription failed. Please try again.");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <CreditCard className="w-8 h-8 text-green-400" />
        Subscription
      </h1>

      {subscription && (
          <div className="mb-8 p-4 bg-green-900/20 border border-green-500/30 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-400" />
              </div>
              <div>
                  <h3 className="font-bold text-green-400">Active Subscription</h3>
                  <p className="text-sm text-green-200/70">
                      {subscription.tier === 'PRO_TRIAL' ? '24h Trial' : 'Pro Monthly'} • Expires {new Date(subscription.endDate).toLocaleDateString()}
                  </p>
              </div>
          </div>
      )}

      <div className="grid gap-6">
        {/* Pro Plan */}
        <Card className="p-6 bg-gray-900/50 backdrop-blur border-green-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-bl-xl">
            RECOMMENDED
          </div>
          
          <h2 className="text-2xl font-bold mb-2">FrameRanker Pro</h2>
          <div className="text-3xl font-bold text-green-400 mb-6">
            $15<span className="text-sm text-gray-400 font-normal">/month</span>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span>Reduced platform fees (50% off)</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span>Higher ranking weight (2x multiplier)</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span>50 Free AI Credits / month</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span>Exclusive "Pro" badge on profile</span>
            </li>
          </ul>

          <Button 
            className="w-full bg-green-600 hover:bg-green-700 mb-4"
            onClick={() => handleSubscribe('monthly')}
            disabled={!!isProcessing}
          >
            {isProcessing === 'monthly' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Subscribe Monthly ($15)
          </Button>
        </Card>

        {/* Trial Plan */}
        <Card className="p-6 bg-gray-900/30 border-gray-800">
          <h2 className="text-xl font-bold mb-2">24h Trial</h2>
          <div className="text-2xl font-bold text-gray-200 mb-4">
            $1<span className="text-sm text-gray-400 font-normal">/24h</span>
          </div>
          <p className="text-gray-400 mb-6 text-sm">
            Try all Pro features for 24 hours. One time only.
          </p>

          <Button 
            variant="outline"
            className="w-full border-gray-700 hover:bg-gray-800"
            onClick={() => handleSubscribe('trial')}
            disabled={!!isProcessing}
          >
            {isProcessing === 'trial' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Start Trial ($1)
          </Button>
        </Card>
      </div>
    </div>
  );
}
