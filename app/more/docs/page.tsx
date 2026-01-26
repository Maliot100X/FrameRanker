import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="w-8 h-8 text-green-500" />
        How it Works
      </h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-3">Ranking System</h2>
          <p className="text-gray-300 leading-relaxed">
            FrameRanker scores profiles based on real engagement, boost activity, and reviewer reputation. 
            The leaderboard updates in real-time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Boosting</h2>
          <p className="text-gray-300 leading-relaxed">
            You can boost your profile or specific posts to appear at the top of the Home feed.
            Boosts are paid in ETH on Base. Proceeds go to the platform treasury and weekly prize pool.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Rewards</h2>
          <p className="text-gray-300 leading-relaxed">
            Every week, the top 3 ranked users receive USDC prizes.
            1st: $50 USDC
            2nd: $25 USDC + Boost
            3rd: $10 USDC + Subscription
          </p>
        </section>
      </div>
    </div>
  );
}
