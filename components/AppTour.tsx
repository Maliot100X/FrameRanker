"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Zap, Star, Bot, Trophy, ArrowRight, Check } from "lucide-react";
import { useFrame } from "@/components/providers/FrameProvider";

export function AppTour() {
  const { user, isSDKLoaded } = useFrame();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check if user has seen tour
  useEffect(() => {
    const checkTourStatus = async () => {
      if (!isSDKLoaded || !user) return;
      
      try {
        const res = await fetch(`/api/user/tour-status?fid=${user.fid}`);
        const data = await res.json();
        
        // If not seen, show tour
        if (!data.hasSeenTour) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Failed to check tour status:", error);
      }
    };
    
    checkTourStatus();
  }, [isSDKLoaded, user]);

  const steps = [
    {
      title: "Welcome to FrameRanker",
      description: "Boost your visibility, earn rewards, and rank higher on Farcaster.",
      icon: <Trophy className="w-12 h-12 text-yellow-500" />,
    },
    {
      title: "Boost Your Profile",
      description: "Use the Boost tab to promote your profile or casts to the top of the leaderboard.",
      icon: <Zap className="w-12 h-12 text-pink-500" />,
    },
    {
      title: "AI Assistant",
      description: "Chat with our AI to get personalized suggestions and automate your actions.",
      icon: <Bot className="w-12 h-12 text-blue-500" />,
    },
    {
      title: "Write Reviews",
      description: "Review other users and earn rewards. Your feedback matters!",
      icon: <Star className="w-12 h-12 text-purple-500" />,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsOpen(false);
    if (user?.fid) {
      try {
        await fetch("/api/user/tour-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fid: user.fid }),
        });
      } catch (error) {
        console.error("Failed to update tour status:", error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
        <button 
          onClick={handleComplete}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-6 mt-4">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center animate-bounce-slow">
            {steps[currentStep].icon}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
            <p className="text-gray-400">{steps[currentStep].description}</p>
          </div>

          <div className="flex gap-2 mt-4">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentStep ? "bg-pink-500" : "bg-gray-700"
                }`}
              />
            ))}
          </div>

          <Button 
            onClick={handleNext} 
            className="w-full bg-pink-600 hover:bg-pink-700 h-12 text-lg font-semibold"
          >
            {currentStep === steps.length - 1 ? (
              <span className="flex items-center">
                Get Started <Check className="ml-2 w-5 h-5" />
              </span>
            ) : (
              <span className="flex items-center">
                Next <ArrowRight className="ml-2 w-5 h-5" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
