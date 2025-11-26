"use client";

import { useState, useEffect } from "react";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { TeacherClassesService, Teacher } from "@/lib/teacher-classes-service";
import AdminAppBar from "@/components/AdminAppBar";
import AdminSidebar from "@/components/AdminSidebar";
import Link from "next/link";

export default function TeachersPage() {
  const { user, isAdmin } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchTeachers = async (isRetry = false) => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      const allTeachers = await TeacherClassesService.getAllTeachers();
      setTeachers(allTeachers);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError("Öğretmenler yüklenirken bir hata oluştu");

      // Auto-retry logic
      if (retryCount < 3) {
        console.log(`Retrying fetchTeachers, attempt ${retryCount + 1}`);
        setRetryCount((prev) => prev + 1);
        setTimeout(() => fetchTeachers(true), 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    fetchTeachers();
  }, [user, isAdmin]);

  // Handle page visibility changes to refresh data when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && isAdmin) {
        console.log("Page became visible, refreshing teachers");
        fetchTeachers();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, isAdmin]);

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

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter((teacher) => {
    if (!searchQuery.trim()) {
      return true;
    }
    const query = searchQuery.toLowerCase().trim();
    const name = (teacher.display_name || "").toLowerCase();
    const email = (teacher.email || "").toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  // Redirect if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
        <AdminAppBar currentPage="teachers" />
        <AdminSidebar currentPage="teachers" />

        {/* Main Content with responsive layout */}
        <div className="lg:ml-64 px-6 pb-24 lg:pb-8 pt-8 min-h-screen">
          <div className="max-w-sm lg:max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Öğretmenler
              </h1>
              <p className="text-gray-600">
                Tüm öğretmenleri görüntüleyin ve yönetin
              </p>
            </div>

            {/* Error State */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={() => fetchTeachers()}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Tekrar Dene
                </button>
              </div>
            )}

            {/* Search Input */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Öğretmen ara (isim veya email)..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg
                      className="h-5 w-5 text-gray-400 hover:text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Teachers List */}
            <div className="space-y-3">
              {/* Skeleton Loaders */}
              {loading && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-24"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                        </div>
                        <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Empty State */}
              {!loading && teachers.length === 0 && (
                <div className="bg-white/80 rounded-2xl p-8 border border-gray-200 shadow-sm text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Henüz öğretmen yok
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Sistemde henüz hiç öğretmen bulunmuyor.
                  </p>
                </div>
              )}

              {/* No Results State */}
              {!loading &&
                teachers.length > 0 &&
                filteredTeachers.length === 0 && (
                  <div className="bg-white/80 rounded-2xl p-8 border border-gray-200 shadow-sm text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Sonuç bulunamadı
                    </h3>
                    <p className="text-gray-600 text-sm">
                      &quot;{searchQuery}&quot; için eşleşen öğretmen
                      bulunamadı.
                    </p>
                  </div>
                )}

              {/* Teachers Cards */}
              {!loading &&
                filteredTeachers.map((teacher) => (
                  <Link
                    key={teacher.user_id}
                    href={`/admin/teacher?teacherId=${teacher.user_id}`}
                    className="block"
                  >
                    <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center gap-3">
                        {/* Teacher Avatar */}
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {teacher.display_name?.charAt(0).toUpperCase() ||
                              teacher.email?.charAt(0).toUpperCase() ||
                              "T"}
                          </span>
                        </div>

                        {/* Teacher Info */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-semibold text-gray-800 truncate"
                            title={teacher.display_name || "İsimsiz Öğretmen"}
                          >
                            {teacher.display_name || "İsimsiz Öğretmen"}
                          </h3>
                          <p
                            className="text-sm text-gray-600 truncate"
                            title={teacher.email}
                          >
                            {teacher.email}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-3 h-3 text-blue-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                />
                              </svg>
                              <span className="text-xs text-blue-600 font-medium">
                                {teacher.total_classes} sınıf
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-3 h-3 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                              <span className="text-xs text-green-600 font-medium">
                                {teacher.total_students} öğrenci
                              </span>
                            </div>
                            {teacher.total_conversations > 0 && (
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-3 h-3 text-purple-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                                <span className="text-xs text-purple-600 font-medium">
                                  {teacher.total_conversations} mesaj
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Role Badge */}
                        <div className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          Öğretmen
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
