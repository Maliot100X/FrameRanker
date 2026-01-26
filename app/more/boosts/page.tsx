import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";

export default function MyBoostsPage() {
  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Zap className="w-8 h-8 text-yellow-400" />
        My Boosts
      </h1>
      <div className="text-center py-10 text-gray-500">
        You haven't boosted any profiles or posts yet.
      </div>
    </div>
  );
}
