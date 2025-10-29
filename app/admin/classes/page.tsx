"use client";

import { useState, useEffect } from "react";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import {
  TeacherClassesService,
  TeacherClass,
} from "@/lib/teacher-classes-service";
import AdminAppBar from "@/components/AdminAppBar";
import AdminSidebar from "@/components/AdminSidebar";
import Link from "next/link";
import { BookOpen, Users, CaretRight, ChatCircle } from "@phosphor-icons/react";

export default function AdminClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchClasses = async (isRetry = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      const teacherClasses = await TeacherClassesService.getTeacherClassesByUid(
        user.id
      );
      // Sort by created_at in descending order (newest first)
      const sortedClasses = [...teacherClasses].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // Descending order
      });
      setClasses(sortedClasses);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Error fetching teacher classes:", err);
      setError("Sınıflar yüklenirken bir hata oluştu");

      // Auto-retry logic
      if (retryCount < 3) {
        console.log(`Retrying fetchClasses, attempt ${retryCount + 1}`);
        setRetryCount((prev) => prev + 1);
        setTimeout(() => fetchClasses(true), 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [user]);

  // Handle page visibility changes to refresh data when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log("Page became visible, refreshing classes");
        fetchClasses();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  // Timeout mechanism to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log("Loading timeout reached, stopping loading state");
        setLoading(false);
        setError("Yükleme zaman aşımına uğradı. Lütfen sayfayı yenileyin.");
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
        <AdminAppBar currentPage="classes" />
        <AdminSidebar currentPage="classes" />

        {/* Main Content with responsive layout */}
        <div className="lg:ml-64 px-6 pb-24 lg:pb-8 pt-8 min-h-screen">
          <div className="max-w-sm lg:max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Sınıflarım
              </h2>
              <p className="text-gray-600">
                Öğrencilerinizi yönetin ve sınıf bilgilerinizi görüntüleyin
              </p>

              {/* Error State */}
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                  <button
                    onClick={() => fetchClasses()}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}
            </div>

            {/* Classes List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Skeleton Loaders */}
              {loading && (
                <>
                  {/* Skeleton Card 1 */}
                  <div className="bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-20"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                        </div>
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-3 ml-15">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                      </div>
                    </div>
                  </div>

                  {/* Skeleton Card 2 */}
                  <div className="bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-16"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                        </div>
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-3 ml-15">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Actual Classes - Only show when not loading */}
              {!loading && classes.length === 0 && (
                <div className="bg-white/80 rounded-2xl p-8 border border-gray-200 shadow-sm text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gray-400" weight="bold" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Henüz sınıf yok
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Henüz hiç sınıfınız bulunmuyor. Yeni sınıf oluşturmak için
                    yöneticinizle iletişime geçin.
                  </p>
                </div>
              )}

              {/* Classes Cards */}
              {!loading &&
                classes.map((classItem) => (
                  <Link
                    key={classItem.id}
                    href={`/admin/class?id=${classItem.id}`}
                    className="block"
                  >
                    <div className="bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.1)] transform hover:translate-y-1 active:translate-y-2 transition-all duration-150 ease-out">
                      <div className="flex flex-col gap-3">
                        {/* First row: Icon + Class Name + Right arrow */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                            <BookOpen
                              className="w-6 h-6 text-white"
                              weight="bold"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">
                              {classItem.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <Users
                                  className="w-4 h-4 text-gray-400"
                                  weight="regular"
                                />
                                <span className="text-sm text-gray-500">
                                  {classItem.student_count} öğrenci
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ChatCircle
                                  className="w-4 h-4 text-gray-400"
                                  weight="regular"
                                />
                                <span className="text-sm text-gray-500">
                                  {classItem.conversation_count} konuşma
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-blue-500">
                            <CaretRight className="w-5 h-5" weight="regular" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
