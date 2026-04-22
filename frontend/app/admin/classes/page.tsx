"use client";

import { useState, useEffect } from "react";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import {
  TeacherClassesService,
  TeacherClass,
  OtherStudentsStats,
  Teacher,
} from "@/lib/teacher-classes-service";
import { BatchService } from "@/lib/batch-service";
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
  SortAscending,
  ChartBar,
  X,
  Play,
  Spinner,
  Calendar,
} from "@phosphor-icons/react";

type FilterType = "active" | "old";

export default function AdminClassesPage() {
  const { user, isAdmin, isTeacher } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [otherStudentsStats, setOtherStudentsStats] =
    useState<OtherStudentsStats | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("active");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null,
  );
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Sort state - only for admin
  type SortType = "conversations" | "name" | "date";
  const [sortBy, setSortBy] = useState<SortType>("conversations");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Batch analysis selection mode
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  // Smart date selector
  type DatePreset = "all" | "today" | "thisWeek" | "thisMonth" | "custom";
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customStartDate, setCustomStartDate] = useState("2024-01-01");
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isDatePresetOpen, setIsDatePresetOpen] = useState(false);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  const fetchTeachers = async () => {
    if (!isAdmin) return;

    try {
      const allTeachers = await TeacherClassesService.getAllTeachers();
      setTeachers(allTeachers);
    } catch (err) {
      console.error("Error fetching teachers:", err);
    }
  };

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

      // If admin selected a teacher, fetch that teacher's classes, otherwise fetch current user's classes
      const teacherIdToFetch =
        isAdmin && selectedTeacherId ? selectedTeacherId : user.id;

      // Tarih filtresini hesapla (analiz modunda)
      const dateRange = isAnalysisMode && datePreset !== "all" ? getDateRange() : null;

      const teacherClasses = await TeacherClassesService.getTeacherClassesByUid(
        teacherIdToFetch,
        isAdmin ? sortBy : "conversations",
        dateRange?.startDate || null,
        dateRange?.endDate || null,
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
    if (isAdmin) {
      fetchTeachers();
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchClasses();
  }, [user, selectedTeacherId, sortBy]);

  // Re-fetch with date filter when analysis mode date changes
  useEffect(() => {
    if (isAnalysisMode) {
      setIsLoadingCounts(true);
      fetchClasses().finally(() => setIsLoadingCounts(false));
    }
  }, [datePreset, customStartDate, customEndDate]);

  // Re-fetch when analysis mode toggled (to reset or apply date filter)
  useEffect(() => {
    fetchClasses();
  }, [isAnalysisMode]);

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

  // Compute actual start/end dates from preset
  const getDateRange = (): { startDate: string; endDate: string } => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    switch (datePreset) {
      case "today":
        return { startDate: todayStr, endDate: todayStr };
      case "thisWeek": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);
        return { startDate: weekStart.toISOString().split("T")[0], endDate: todayStr };
      }
      case "thisMonth": {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { startDate: monthStart.toISOString().split("T")[0], endDate: todayStr };
      }
      case "custom":
        return { startDate: customStartDate, endDate: customEndDate };
      case "all":
      default:
        return { startDate: "2020-01-01", endDate: todayStr };
    }
  };

  const datePresetLabel = () => {
    switch (datePreset) {
      case "all": return "Tüm Zamanlar";
      case "today": return "Bugün";
      case "thisWeek": return "Bu Hafta";
      case "thisMonth": return "Bu Ay";
      case "custom": return "Özel Aralık";
    }
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedClassIds.size === filteredClasses.length) {
      setSelectedClassIds(new Set());
    } else {
      setSelectedClassIds(new Set(filteredClasses.map((c) => c.id)));
    }
  };

  const handleStartBatchAnalysis = async () => {
    if (selectedClassIds.size === 0) return;

    setIsCreatingBatch(true);
    try {
      const { startDate, endDate } = getDateRange();

      for (const classId of selectedClassIds) {
        const students = await TeacherClassesService.getClassStudents(classId);
        const studentIds = students.map((s: any) => s.user_id);

        if (studentIds.length === 0) continue;

        await BatchService.createJob({
          studentIds,
          classId,
          startDate,
          endDate,
        });
      }

      alert(`${selectedClassIds.size} sınıf için analiz işleri başlatıldı!`);
      setSelectedClassIds(new Set());
      setIsAnalysisMode(false);
    } catch (error) {
      console.error("Batch analysis error:", error);
      alert("Analiz başlatılırken hata oluştu!");
    } finally {
      setIsCreatingBatch(false);
    }
  };

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
                <div className="flex justify-center gap-4 mb-6 flex-wrap">
                  {/* Analysis Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAnalysisMode(!isAnalysisMode);
                      if (isAnalysisMode) setSelectedClassIds(new Set());
                    }}
                    className={`pl-3 pr-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex items-center gap-2 ${
                      isAnalysisMode
                        ? "bg-blue-600 text-white border-2 border-blue-600 hover:bg-blue-700"
                        : "bg-white/90 backdrop-blur-sm border-2 border-gray-200 text-gray-700 hover:bg-white hover:border-blue-400"
                    }`}
                  >
                    <ChartBar className="w-4 h-4" weight="bold" />
                    <span>{isAnalysisMode ? "Seçimi İptal Et" : "Analiz Seç"}</span>
                  </button>
                  {/* Teacher Filter */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsTeacherDropdownOpen(!isTeacherDropdownOpen)
                      }
                      className="pl-9 pr-8 py-2 bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer min-w-[200px] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Users
                          className="w-4 h-4 text-gray-400"
                          weight="regular"
                        />
                        <span>
                          {selectedTeacherId
                            ? teachers.find(
                                (t) => t.user_id === selectedTeacherId,
                              )?.display_name || "Öğretmen Seçin"
                            : "Tüm Öğretmenler"}
                        </span>
                      </div>
                      <CaretDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          isTeacherDropdownOpen ? "rotate-180" : ""
                        }`}
                        weight="bold"
                      />
                    </button>

                    {/* Teacher Dropdown Menu */}
                    {isTeacherDropdownOpen && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsTeacherDropdownOpen(false)}
                        />
                        {/* Dropdown Options */}
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border-2 border-gray-200 shadow-lg z-20 overflow-hidden max-h-64 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTeacherId(null);
                              setIsTeacherDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                              !selectedTeacherId
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>Tüm Öğretmenler</span>
                            {!selectedTeacherId && (
                              <Check
                                className="w-4 h-4 text-blue-600"
                                weight="bold"
                              />
                            )}
                          </button>
                          <div className="border-t border-gray-100" />
                          {teachers.map((teacher) => (
                            <button
                              key={teacher.user_id}
                              type="button"
                              onClick={() => {
                                setSelectedTeacherId(teacher.user_id);
                                setIsTeacherDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                                selectedTeacherId === teacher.user_id
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span>
                                {teacher.display_name || teacher.email}
                              </span>
                              {selectedTeacherId === teacher.user_id && (
                                <Check
                                  className="w-4 h-4 text-blue-600"
                                  weight="bold"
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Active/Old Filter */}
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

                  {/* Sort Filter - Only for admin */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                      className="pl-9 pr-8 py-2 bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer min-w-[180px] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <SortAscending
                          className="w-4 h-4 text-gray-400"
                          weight="regular"
                        />
                        <span>
                          {sortBy === "conversations"
                            ? "Mesaj Sayısı"
                            : sortBy === "name"
                              ? "İsme Göre"
                              : "Son Mesaj Tarihine Göre"}
                        </span>
                      </div>
                      <CaretDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          isSortDropdownOpen ? "rotate-180" : ""
                        }`}
                        weight="bold"
                      />
                    </button>

                    {/* Sort Dropdown Menu */}
                    {isSortDropdownOpen && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => {
                            setIsSortDropdownOpen(false);
                          }}
                        />
                        {/* Dropdown Options */}
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl border-2 border-gray-200 shadow-lg z-20 overflow-hidden min-w-[200px]">
                          <button
                            type="button"
                            onClick={() => {
                              setSortBy("conversations");
                              setIsSortDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                              sortBy === "conversations"
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>Mesaj Sayısı</span>
                            {sortBy === "conversations" && (
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
                              setSortBy("name");
                              setIsSortDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                              sortBy === "name"
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>İsme Göre</span>
                            {sortBy === "name" && (
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
                              setSortBy("date");
                              setIsSortDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                              sortBy === "date"
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>Son Mesaj Tarihi</span>
                            {sortBy === "date" && (
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

            {/* Skeleton Loaders */}
            {loading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
              </div>
            )}

            {/* Empty State - Show centered when no classes found */}
            {!loading && filteredClasses.length === 0 && (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="bg-white/80 rounded-2xl p-8 border border-gray-200 shadow-sm text-center max-w-md">
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
              </div>
            )}

            {/* Classes List */}
            {!loading && filteredClasses.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Classes Cards */}
                {!loading &&
                  filteredClasses.map((classItem) => (
                    <div key={classItem.id} className="relative">
                      {/* Checkbox overlay in analysis mode */}
                      {isAnalysisMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleClassSelection(classItem.id);
                          }}
                          className="absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-150"
                          style={{
                            backgroundColor: selectedClassIds.has(classItem.id) ? '#2563eb' : 'white',
                            borderColor: selectedClassIds.has(classItem.id) ? '#2563eb' : '#d1d5db',
                          }}
                        >
                          {selectedClassIds.has(classItem.id) && (
                            <Check className="w-4 h-4 text-white" weight="bold" />
                          )}
                        </button>
                      )}
                      <Link
                        href={isAnalysisMode ? "#" : `/admin/class?id=${classItem.id}`}
                        className="block"
                        onClick={(e) => {
                          if (isAnalysisMode) {
                            e.preventDefault();
                            toggleClassSelection(classItem.id);
                          }
                        }}
                      >
                        <div className={`bg-white/80 rounded-2xl p-5 border-2 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.1)] transform hover:translate-y-1 active:translate-y-2 transition-all duration-150 ease-out ${
                          isAnalysisMode && selectedClassIds.has(classItem.id)
                            ? "border-blue-500 bg-blue-50/50"
                            : "border-gray-200"
                        }`}>
                          <div className="flex flex-col gap-3">
                            {/* First row: Icon + Class Name + Right arrow */}
                            <div className={`flex items-center gap-3 ${isAnalysisMode ? "ml-7" : ""}`}>
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
                                      {isLoadingCounts ? "..." : classItem.conversation_count} konuşma
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {!isAnalysisMode && (
                                <div className="text-blue-500">
                                  <CaretRight
                                    className="w-5 h-5"
                                    weight="regular"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}

                {/* Other Students Card - Only for admin and when no teacher filter is selected */}
                {!loading &&
                  isAdmin &&
                  !selectedTeacherId &&
                  otherStudentsStats &&
                  otherStudentsStats.student_count > 0 && (
                    <Link
                      href="/admin/class?id=other-students"
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
                              <CaretRight
                                className="w-5 h-5"
                                weight="regular"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Floating Analysis Action Bar */}
        {isAnalysisMode && (
          <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-40 p-4">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row items-center gap-4">
                {/* Info */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <ChartBar className="w-5 h-5 text-blue-600" weight="bold" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {selectedClassIds.size} sınıf seçildi
                    </p>
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {selectedClassIds.size === filteredClasses.length ? "Tümünü kaldır" : "Tümünü seç"}
                    </button>
                  </div>
                </div>

                {/* Smart Date Selector */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDatePresetOpen(!isDatePresetOpen)}
                      className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:border-blue-400 transition-all flex items-center gap-2 min-w-[160px]"
                    >
                      <Calendar className="w-4 h-4 text-gray-400" weight="regular" />
                      <span>{datePresetLabel()}</span>
                      <CaretDown
                        className={`w-3 h-3 text-gray-400 absolute right-2 transition-transform ${isDatePresetOpen ? "rotate-180" : ""}`}
                        weight="bold"
                      />
                    </button>

                    {isDatePresetOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-50"
                          onClick={() => setIsDatePresetOpen(false)}
                        />
                        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl border-2 border-gray-200 shadow-lg z-[60] overflow-hidden min-w-[180px]">
                          {(["all", "today", "thisWeek", "thisMonth", "custom"] as DatePreset[]).map((preset) => {
                            const labels: Record<DatePreset, string> = {
                              all: "Tüm Zamanlar",
                              today: "Bugün",
                              thisWeek: "Bu Hafta",
                              thisMonth: "Bu Ay",
                              custom: "Özel Aralık",
                            };
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setDatePreset(preset);
                                  setIsDatePresetOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors flex items-center justify-between border-b border-gray-50 last:border-b-0 ${
                                  datePreset === preset
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <span>{labels[preset]}</span>
                                {datePreset === preset && (
                                  <Check className="w-4 h-4 text-blue-600" weight="bold" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Custom date inputs - only when custom is selected */}
                  {datePreset === "custom" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none w-32"
                      />
                      <span className="text-gray-400 text-xs">—</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none w-32"
                      />
                    </div>
                  )}

                  {/* Loading indicator */}
                  {isLoadingCounts && (
                    <Spinner className="w-4 h-4 text-blue-500 animate-spin" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClassIds(new Set());
                      setIsAnalysisMode(false);
                    }}
                    className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={handleStartBatchAnalysis}
                    disabled={isCreatingBatch || selectedClassIds.size === 0}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingBatch ? (
                      <Spinner className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play weight="fill" className="w-4 h-4" />
                    )}
                    Analizi Başlat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminProtectedRoute>
  );
}
