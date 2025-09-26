"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

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
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* App Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          İklim İçin Tasarla
        </h1>
        
        {/* Subtitle */}
        <p className="text-gray-600 text-lg">
          Çocuklar için iklim dostu öğrenme
        </p>
      </div>
    </div>
  );
}
