"use client";

import { useState, useEffect } from "react";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { TeacherClassesService } from "@/lib/teacher-classes-service";
import AdminAppBar from "@/components/AdminAppBar";
import AdminSidebar from "@/components/AdminSidebar";
import Link from "next/link";

interface AdminStats {
  totalClasses: number;
  totalStudents: number;
  totalInteractions: number;
}

export default function AdminHomePage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalClasses: 0,
    totalStudents: 0,
    totalInteractions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchStats = async (isRetry = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }
      
      // Fetch classes and calculate stats
      const classes = await TeacherClassesService.getTeacherClassesByUid(user.id);
      let totalStudents = 0;
      
      // Calculate total students across all classes
      for (const classItem of classes) {
        totalStudents += classItem.student_count;
      }

      // For now, we'll use placeholder data for interactions
      // In a real app, you'd fetch this from your analytics/stats service
      const totalInteractions = 2952; // This would come from your chat/analytics data

      setStats({
        totalClasses: classes.length,
        totalStudents: totalStudents,
        totalInteractions: totalInteractions
      });
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('İstatistikler yüklenirken bir hata oluştu');
      
      // Auto-retry logic
      if (retryCount < 3) {
        console.log(`Retrying fetchStats, attempt ${retryCount + 1}`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchStats(true), 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Don't fetch stats if auth is still loading
    if (authLoading) {
      return;
    }

    // If no user, stop loading
    if (!user) {
      setLoading(false);
      return;
    }

    fetchStats();
  }, [user, authLoading]);

  // Handle page visibility changes to refresh data when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !authLoading) {
        console.log('Page became visible, refreshing stats');
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, authLoading]);

  // Fallback: if auth loading is done but we're still in loading state for too long, stop loading
  useEffect(() => {
    if (!authLoading && user && loading) {
      const timeout = setTimeout(() => {
        console.log('Loading timeout - stopping loading state');
        setLoading(false);
        setError('Yükleme zaman aşımına uğradı. Lütfen sayfayı yenileyin.');
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeout);
    }
  }, [authLoading, user, loading]);

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
        <AdminAppBar currentPage="overview" />
        <AdminSidebar currentPage="overview" />
        
        {/* Main Content with responsive layout */}
        <div className="lg:ml-64 px-6 pb-24 lg:pb-8 pt-8 min-h-screen">
          <div className="max-w-sm lg:max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Kontrol Paneli Genel Bakışı
              </h1>
              <p className="text-gray-600">
                Yönetici paneli ve sistem istatistikleri
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              {loading ? (
                // Skeleton loading cards
                <>
                  {/* Skeleton Card 1 */}
                  <div className="bg-white/80 rounded-2xl p-6 border border-gray-200 shadow-sm animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2 w-16"></div>
                        <div className="h-8 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  </div>

                  {/* Skeleton Card 2 */}
                  <div className="bg-white/80 rounded-2xl p-6 border border-gray-200 shadow-sm animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2 w-20"></div>
                        <div className="h-8 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  </div>

                  {/* Skeleton Card 3 */}
                  <div className="bg-white/80 rounded-2xl p-6 border border-gray-200 shadow-sm animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Actual content cards
                <>
                  {/* Classes Card */}
                  <div className="bg-white/80 rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-600">Sınıflar</h3>
                        <div className="text-2xl font-bold text-gray-900">
                          {stats.totalClasses}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Students Card */}
                  <div className="bg-white/80 rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-600">Öğrenciler</h3>
                        <div className="text-2xl font-bold text-gray-900">
                          {stats.totalStudents}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactions Card */}
                  <div className="bg-white/80 rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-600">Toplam Etkileşimler</h3>
                        <div className="text-2xl font-bold text-gray-900">
                          {stats.totalInteractions.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Error State */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
                <button 
                  onClick={() => fetchStats()}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Tekrar Dene
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Hızlı İşlemler</h2>
              
              {/* Classes Link */}
              <Link href="/admin/classes" className="block">
                <div className="bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">Sınıflarım</h3>
                      <p className="text-sm text-gray-600">Sınıfları görüntüle ve yönet</p>
                    </div>
                    <div className="text-blue-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
