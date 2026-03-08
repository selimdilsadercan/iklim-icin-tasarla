"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/hooks/useTranslations";
import Image from "next/image";

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const t = useTranslations('app');

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (loading) return;

    // Add a minimum splash duration for better UX
    const redirectTimer = setTimeout(() => {
      if (user) {
        // User is authenticated, redirect to home
        router.push("/home");
      } else {
        // User is not authenticated, redirect to login
        router.push("/login");
      }
    }, 1500); // 1.5 second minimum splash duration

    return () => clearTimeout(redirectTimer);
  }, [user, loading, router]);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
      <div className="text-center">
        {/* App Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto shadow-2xl">
            <Image 
              src="/logo.png" 
              alt={`${t('title')} Logo`} 
              width={80} 
              height={80} 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* App Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          {t('title')}
        </h1>
        
        {/* Subtitle */}
        <p className="text-gray-600 text-lg">
          {t('subtitle')}
        </p>
      </div>
    </div>
  );
}
