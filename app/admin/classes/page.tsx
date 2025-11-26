"use client";

import { useState, useEffect } from "react";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import {
  TeacherClassesService,
  TeacherClass,
  OtherStudentsStats,
} from "@/lib/teacher-classes-service";
import AdminAppBar from "@/components/AdminAppBar";
import AdminSidebar from "@/components/AdminSidebar";
import Link from "next/link";
import {
  BookOpen,
  Users,
  CaretRight,
  CaretDown,
  ChatCircle,
  Funnel,
  Check,
} from "@phosphor-icons/react";

type FilterType = "active" | "old";

export default function AdminClassesPage() {
  const { user, isAdmin, isTeacher } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [otherStudentsStats, setOtherStudentsStats] =
    useState<OtherStudentsStats | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("active");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
      // SQL already sorts by conversation_count DESC, so we can use the data as-is
      setClasses(teacherClasses);

      // Fetch other students stats if admin
      if (isAdmin) {
        try {
          const stats = await TeacherClassesService.getOtherStudentsStats();
          setOtherStudentsStats(stats);
        } catch (err) {
          console.error("Error fetching other students stats:", err);
          // Don't fail the whole request if this fails
        }
      }

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

  // Filter classes based on filterType
  // If user is teacher (not admin), show all classes without filtering
  const getFilteredClasses = () => {
    // Teacher kullanıcılar için filtreleme yok, tüm sınıfları göster
    if (isTeacher && !isAdmin) {
      return classes;
    }

    // Admin kullanıcılar için filtreleme uygula
    return classes.filter((classItem) => {
      if (filterType === "active") {
        // Aktif sınıf: is_active === true olan sınıflar
        return classItem.is_active === true;
      } else {
        // Eski sınıf: is_active === false olan sınıflar
        return classItem.is_active === false;
      }
    });
  };

  const filteredClasses = getFilteredClasses();

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
              <p className="text-gray-600 mb-4">
                Öğrencilerinizi yönetin ve sınıf bilgilerinizi görüntüleyin
              </p>

              {/* Filter Section - Only show for admin users */}
              {isAdmin && (
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="pl-9 pr-8 py-2 bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer min-w-[180px] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Funnel
                          className="w-4 h-4 text-gray-400"
                          weight="regular"
                        />
                        <span>
                          {filterType === "active"
                            ? "Aktif Sınıflar"
                            : "Eski Sınıflar"}
                        </span>
                      </div>
                      <CaretDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                        weight="bold"
                      />
                    </button>

                    {/* Custom Dropdown Menu */}
                    {isDropdownOpen && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        {/* Dropdown Options */}
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border-2 border-gray-200 shadow-lg z-20 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterType("active");
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                              filterType === "active"
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>Aktif Sınıflar</span>
                            {filterType === "active" && (
                              <Check
                                className="w-4 h-4 text-blue-600"
                                weight="bold"
                              />
                            )}
                          </button>
                          <div className="border-t border-gray-100" />
                          <button
                            type="button"
                            onClick={() => {
                              setFilterType("old");
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                              filterType === "old"
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>Eski Sınıflar</span>
                            {filterType === "old" && (
                              <Check
                                className="w-4 h-4 text-blue-600"
                                weight="bold"
                              />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

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
              {!loading && filteredClasses.length === 0 && (
                <div className="bg-white/80 rounded-2xl p-8 border border-gray-200 shadow-sm text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gray-400" weight="bold" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {isAdmin
                      ? filterType === "active"
                        ? "Aktif sınıf bulunamadı"
                        : "Eski sınıf bulunamadı"
                      : "Sınıf bulunamadı"}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {isAdmin
                      ? filterType === "active"
                        ? "Son 6 ay içinde oluşturulmuş aktif sınıf bulunmuyor."
                        : "6 aydan eski sınıf bulunmuyor."
                      : "Henüz sınıf bulunmuyor."}
                  </p>
                </div>
              )}

              {/* Classes Cards */}
              {!loading &&
                filteredClasses.map((classItem) => (
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

              {/* Other Students Card - Only for admin */}
              {!loading &&
                isAdmin &&
                otherStudentsStats &&
                otherStudentsStats.student_count > 0 && (
                  <Link href="/admin/class?id=other-students" className="block">
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
                              Diğer Öğrenciler
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <Users
                                  className="w-4 h-4 text-gray-400"
                                  weight="regular"
                                />
                                <span className="text-sm text-gray-500">
                                  {otherStudentsStats.student_count} öğrenci
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ChatCircle
                                  className="w-4 h-4 text-gray-400"
                                  weight="regular"
                                />
                                <span className="text-sm text-gray-500">
                                  {otherStudentsStats.conversation_count}{" "}
                                  konuşma
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
                )}
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
