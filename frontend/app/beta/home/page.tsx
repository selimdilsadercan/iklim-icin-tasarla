"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBeta } from "@/contexts/BetaContext";
import { BOT_PERSONAS } from "@/lib/ai-service";
import Image from "next/image";
import AppBar from "@/components/AppBar";
import BetaBanner from "@/components/BetaBanner";

export default function BetaHomePage() {
  const router = useRouter();
  const { betaUser, disableBetaMode } = useBeta();
  const [loading, setLoading] = useState(false);

  const handleBotClick = (botSlug: string) => {
    router.push(`/beta/chat/${botSlug}`);
  };

  const handleExitBeta = () => {
    disableBetaMode();
    router.push("/login");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      <BetaBanner />
      <AppBar currentPage="home" />
      
      {/* Main Content */}
      <div className="px-6 pb-24 pt-8 min-h-screen">
        <div className="max-w-sm mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Hoş Geldin! 🌱
            </h2>
            <p className="text-gray-600 mb-4">
              Beta test modunda asistanlar ile konuşmaya başlayabilirsin!
            </p>
          </div>



          {/* Character Assistants */}
          <div className="space-y-4">
            {Object.entries(BOT_PERSONAS).map(([slug, bot]) => (
              <div
                key={slug}
                onClick={() => handleBotClick(slug)}
                className="bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.1)] transform hover:translate-y-1 active:translate-y-2 transition-all duration-150 ease-out cursor-pointer"
              >
                <div className="flex flex-col gap-3">
                  {/* First row: Icon + Title + Right arrow */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${bot.color} rounded-xl overflow-hidden`}>
                      <Image 
                        src={`/bot/${slug}.jpeg`} 
                        alt={bot.name} 
                        width={48} 
                        height={48} 
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{bot.name}</h3>
                      <p className="text-sm text-gray-600">{bot.role}</p>
                    </div>
                    <div className={`${bot.color.includes('green') ? 'text-green-500' : bot.color.includes('yellow') ? 'text-yellow-500' : bot.color.includes('orange') ? 'text-orange-500' : 'text-blue-500'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
