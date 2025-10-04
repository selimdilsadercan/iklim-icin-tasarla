"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

export function UserProtectedRoute({ children }: UserProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (loading) return;

    // If user is not logged in, redirect to root
    if (!user) {
      router.push("/");
      return;
    }

    // If user is admin, redirect to admin panel
    if (isAdmin) {
      router.push("/admin");
      return;
    }

    // If user is logged in and not admin, allow access to the page
  }, [user, isAdmin, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-200 rounded animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in or is admin, don't render children
  if (!user || isAdmin) {
    return null;
  }

  // Render the protected content for normal users
  return <>{children}</>;
}
