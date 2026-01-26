import { Card } from "@/components/ui/card";
import { BarChart3, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="w-8 h-8 text-blue-500" />
        Analytics
      </h1>

      <Card className="p-8 flex flex-col items-center text-center space-y-4 bg-gray-900/50 border-gray-800">
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold">Pro Feature</h2>
        <p className="text-gray-400">
          Subscribe to FrameRanker Pro to access detailed analytics about your profile performance, boost ROI, and engagement trends.
        </p>
        <Link href="/more/subscription" className="w-full">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            Upgrade to Pro
          </Button>
        </Link>
      </Card>
    </div>
  );
}
