import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function MyReviewsPage() {
  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Star className="w-8 h-8 text-pink-400" />
        My Reviews
      </h1>
      <div className="text-center py-10 text-gray-500">
        No reviews received yet.
      </div>
    </div>
  );
}
