import { Card } from "@/components/ui/card";
import { Gift, Trophy } from "lucide-react";

export default function GiveawaysPage() {
  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Gift className="w-8 h-8 text-pink-500" />
        Weekly Giveaways
      </h1>

      <Card className="p-6 bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-pink-500/30 mb-8">
        <h2 className="text-xl font-bold mb-2">Next Draw: Sunday 12:00 UTC</h2>
        <div className="text-3xl font-mono font-bold text-pink-400 mb-4">
          $85.00 USDC Pool
        </div>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>1st Place: $50 USDC</span>
          </li>
          <li className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gray-400" />
            <span>2nd Place: $25 USDC + Free Boost</span>
          </li>
          <li className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-orange-400" />
            <span>3rd Place: $10 USDC + Subscription</span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-gray-400">
          *Rank on the leaderboard to qualify. Winners are selected automatically.
        </p>
      </Card>

      <h3 className="text-lg font-bold mb-4">Past Winners</h3>
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-500">
          No winners yet. First draw this Sunday!
        </div>
      </div>
    </div>
  );
}
