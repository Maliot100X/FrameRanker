import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function ActivityPage() {
  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Activity className="w-8 h-8 text-blue-400" />
        My Activity
      </h1>
      <div className="text-center py-10 text-gray-500">
        No recent activity found.
      </div>
    </div>
  );
}
