"use client";

import { useState, useEffect, Suspense } from "react";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import {
  TeacherClassesService,
  TeacherClass,
  Teacher,
} from "@/lib/teacher-classes-service";
import AdminAppBar from "@/components/AdminAppBar";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Users, CaretRight, ChatCircle } from "@phosphor-icons/react";

function TeacherDetailPageContent() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherId = searchParams.get("teacherId");

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchTeacherData = async (isRetry = false) => {
    if (!user || !isAdmin || !teacherId) {
      setLoading(false);
      return;
    }

    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      // Fetch teacher info
      const allTeachers = await TeacherClassesService.getAllTeachers();
      const foundTeacher = allTeachers.find((t) => t.user_id === teacherId);
      setTeacher(foundTeacher || null);

      // Fetch teacher's classes
      const teacherClasses = await TeacherClassesService.getTeacherClassesByUid(
        teacherId
      );
      setClasses(teacherClasses);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Error fetching teacher data:", err);
      setError("Öğretmen bilgileri yüklenirken bir hata oluştu");

      // Auto-retry logic
      if (retryCount < 3) {
        console.log(`Retrying fetchTeacherData, attempt ${retryCount + 1}`);
        setRetryCount((prev) => prev + 1);
        setTimeout(() => fetchTeacherData(true), 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, [user, isAdmin, teacherId]);

  // Handle page visibility changes to refresh data when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && isAdmin && teacherId) {
        console.log("Page became visible, refreshing teacher data");
        fetchTeacherData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, isAdmin, teacherId]);

  // Redirect if no teacherId
  useEffect(() => {
    if (!teacherId) {
      router.push("/admin/teachers");
    }
  }, [teacherId, router]);

  // Redirect if not admin
  if (!isAdmin) {
    return null;
  }

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
        <AdminSidebar currentPage={null} />

        {/* Main Content with responsive layout */}
        <div className="lg:ml-64">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-sm lg:max-w-6xl mx-auto flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-800">
                  {teacher?.display_name || teacher?.email || "Öğretmen"}
                </h1>
                <p className="text-sm text-gray-600">Öğretmen Sınıfları</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-24 lg:pb-8 pt-8">
            <div className="max-w-sm lg:max-w-6xl mx-auto">
              {/* Error State */}
              {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                  <button
                    onClick={() => fetchTeacherData()}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}

              {/* Teacher Stats */}
              {!loading && teacher && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <BookOpen
                          className="w-5 h-5 text-blue-600"
                          weight="bold"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Sınıflar</p>
                        <p className="text-xl font-bold text-gray-900">
                          {teacher.total_classes}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <Users
                          className="w-5 h-5 text-green-600"
                          weight="bold"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Öğrenciler</p>
                        <p className="text-xl font-bold text-gray-900">
                          {teacher.total_students}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <ChatCircle
                          className="w-5 h-5 text-purple-600"
                          weight="bold"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Mesajlar</p>
                        <p className="text-xl font-bold text-gray-900">
                          {teacher.total_conversations}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Classes List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Skeleton Loaders */}
                {loading && (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-20"></div>
                              <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                            </div>
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Empty State */}
                {!loading && classes.length === 0 && (
                  <div className="bg-white/80 rounded-2xl p-8 border border-gray-200 shadow-sm text-center col-span-full">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <BookOpen
                        className="w-8 h-8 text-gray-400"
                        weight="bold"
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Henüz sınıf yok
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Bu öğretmenin henüz hiç sınıfı bulunmuyor.
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
                              <CaretRight
                                className="w-5 h-5"
                                weight="regular"
                              />
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
      </div>
    </AdminProtectedRoute>
  );
}

export default function TeacherDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <TeacherDetailPageContent />
    </Suspense>
  );
}
