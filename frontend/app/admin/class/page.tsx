"use client";

import { useState, useEffect, Suspense } from "react";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import {
  TeacherClassesService,
  ClassStudent,
} from "@/lib/teacher-classes-service";
import { StudentService } from "@/lib/student-service";
import AdminAppBar from "@/components/AdminAppBar";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  CaretDown,
  Check,
  ChatCircle,
  Funnel,
  SortAscending,
} from "@phosphor-icons/react";

function ClassDetailPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("id");

  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [className, setClassName] = useState<string>("Sınıf");
  const [retryCount, setRetryCount] = useState(0);

  // Date filter state
  type DateFilterType = "all" | "today" | "thisWeek" | "thisMonth" | "custom";
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Sort state
  type SortType = "conversations" | "name" | "date";
  const [sortBy, setSortBy] = useState<SortType>("conversations");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Bot selection state
  const [selectedBotIndex, setSelectedBotIndex] = useState<number | null>(null); // null = Tümü
  const [isBotDropdownOpen, setIsBotDropdownOpen] = useState(false);

  // Message count filter state
  type MessageCountFilterType = "all" | "min10" | "min20" | "min50";
  const [messageCountFilter, setMessageCountFilter] = useState<MessageCountFilterType>("all");
  const [isMessageCountDropdownOpen, setIsMessageCountDropdownOpen] = useState(false);

  // Helper function to get minimum message count based on filter
  const getMinMessageCount = (filterType: MessageCountFilterType): number => {
    switch (filterType) {
      case "min10": return 10;
      case "min20": return 20;
      case "min50": return 50;
      case "all":
      default: return 0;
    }
  };

  // Helper function to get date range based on filter type
  const getDateRange = (
    filterType: DateFilterType
  ): { startDate: string | null; endDate: string | null } => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (filterType) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        break;
      case "thisWeek":
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "thisMonth":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      case "all":
      default:
        return { startDate: null, endDate: null };
    }

    return {
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
    };
  };

  const fetchStudents = async (isRetry = false) => {
    if (!user || !classId) {
      setLoading(false);
      return;
    }

    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      let classStudents: ClassStudent[];

      // Check if this is the "other students" class
      if (classId === "other-students") {
        classStudents = await TeacherClassesService.getOtherStudents();
        setClassName("Diğer Öğrenciler");
      } else {
        const { startDate, endDate } = getDateRange(dateFilter);
        classStudents = await TeacherClassesService.getClassStudents(
          classId,
          startDate,
          endDate,
          sortBy
        );
        // Get class name from the first student's data or use a default
        if (classStudents.length > 0) {
          setClassName(classStudents[0].class_name || "Sınıf");
        } else {
          setClassName("Sınıf");
        }
      }

      setStudents(classStudents);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Error fetching class students:", err);
      setError("Öğrenciler yüklenirken bir hata oluştu");

      // Auto-retry logic
      if (retryCount < 3) {
        console.log(`Retrying fetchStudents, attempt ${retryCount + 1}`);
        setRetryCount((prev) => prev + 1);
        setTimeout(() => fetchStudents(true), 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user, classId, dateFilter, customStartDate, customEndDate, sortBy]);

  // Handle page visibility changes to refresh data when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && classId) {
        console.log("Page became visible, refreshing students");
        fetchStudents();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, classId]);

  // Redirect if no classId
  useEffect(() => {
    if (!classId) {
      router.push("/admin/classes");
    }
  }, [classId, router]);

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

  // Filter students based on search query and message count
  const minMessageCount = getMinMessageCount(messageCountFilter);
  const filteredStudents = students.filter((student) => {
    // First apply message count filter
    if (student.total_conversations < minMessageCount) {
      return false;
    }
    
    // Then apply search filter
    if (!searchQuery.trim()) {
      return true;
    }
    const query = searchQuery.toLowerCase().trim();
    const name = (student.display_name || "").toLowerCase();
    const email = (student.email || "").toLowerCase();
    return name.includes(query) || email.includes(query);
  });

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
                <h1 className="text-xl font-bold text-gray-800">{className}</h1>
                <p className="text-sm text-gray-600">Sınıf Öğrencileri</p>
              </div>
              
              {students.length > 0 && (
                <div className="flex items-center gap-2">
                  {/* Bot Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setIsBotDropdownOpen(!isBotDropdownOpen)}
                      className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 min-w-[100px] justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        {selectedBotIndex !== null && (
                          <div className={`w-2 h-2 rounded-full ${
                            selectedBotIndex === 0 ? 'bg-green-500' :
                            selectedBotIndex === 1 ? 'bg-blue-500' :
                            selectedBotIndex === 2 ? 'bg-yellow-500' :
                            selectedBotIndex === 3 ? 'bg-cyan-500' : 'bg-gray-500'
                          }`} />
                        )}
                        <span>
                          {selectedBotIndex === null ? "Tüm Botlar" : 
                           selectedBotIndex === 0 ? "Yaprak" :
                           selectedBotIndex === 1 ? "Robi" :
                           selectedBotIndex === 2 ? "Buğday" :
                           selectedBotIndex === 3 ? "Damla" : "Bot"}
                        </span>
                      </div>
                      <CaretDown className={`w-3 h-3 transition-transform ${isBotDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isBotDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsBotDropdownOpen(false)} />
                        <div className="absolute top-full right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-20 min-w-[140px] overflow-hidden py-1">
                          <button
                            onClick={() => {
                              setSelectedBotIndex(null);
                              setIsBotDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 flex items-center gap-2 ${selectedBotIndex === null ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                          >
                            <span>Tüm Botlar</span>
                            {selectedBotIndex === null && <Check className="w-3 h-3 ml-auto text-blue-600" />}
                          </button>
                          {[
                            { id: 0, name: 'Yaprak', color: 'bg-green-500' },
                            { id: 1, name: 'Robi', color: 'bg-blue-500' },
                            { id: 2, name: 'Buğday', color: 'bg-yellow-500' },
                            { id: 3, name: 'Damla', color: 'bg-cyan-500' }
                          ].map((bot) => (
                            <button
                              key={bot.id}
                              onClick={() => {
                                setSelectedBotIndex(bot.id);
                                setIsBotDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 flex items-center gap-2 ${selectedBotIndex === bot.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                            >
                              <div className={`w-2 h-2 rounded-full ${bot.color}`} />
                              <span>{bot.name}</span>
                              {selectedBotIndex === bot.id && <Check className="w-3 h-3 ml-auto text-blue-600" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1" /> {/* Divider */}

                  {/* XLSX Download - FIRST */}
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const { startDate, endDate } = getDateRange(dateFilter);
                        await StudentService.downloadClassConversationsAsZip(
                          filteredStudents,
                          'xlsx',
                          className,
                          startDate,
                          endDate,
                          selectedBotIndex
                        );
                      } catch (error) {
                        console.error('Error downloading XLSX:', error);
                        setError('İndirme sırasında bir hata oluştu');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    XLSX
                  </button>
                  
                  {/* CSV Download */}
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                      const { startDate, endDate } = getDateRange(dateFilter);
                        await StudentService.downloadClassConversationsAsZip(
                          filteredStudents,
                          'csv',
                          className,
                          startDate,
                          endDate,
                          selectedBotIndex
                        );
                      } catch (error) {
                        console.error('Error downloading CSV:', error);
                        setError('İndirme sırasında bir hata oluştu');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV
                  </button>
                  
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                      const { startDate, endDate } = getDateRange(dateFilter);
                        await StudentService.downloadClassConversationsAsZip(
                          filteredStudents,
                          'json',
                          className,
                          startDate,
                          endDate,
                          selectedBotIndex
                        );
                      } catch (error) {
                        console.error('Error downloading JSON:', error);
                        setError('İndirme sırasında bir hata oluştu');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    JSON
                  </button>
                  
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                      const { startDate, endDate } = getDateRange(dateFilter);
                        await StudentService.downloadClassConversationsAsZip(
                          filteredStudents,
                          'txt',
                          className,
                          startDate,
                          endDate,
                          selectedBotIndex
                        );
                      } catch (error) {
                        console.error('Error downloading TXT:', error);
                        setError('İndirme sırasında bir hata oluştu');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    TXT
                  </button>
                </div>
              )}
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
                    onClick={() => fetchStudents()}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}

              {/* Filters Section */}
              <div className="mb-6 flex flex-col gap-4">
                {/* All Filters in One Row */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
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
                      placeholder="Öğrenci ara (isim veya email)..."
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

                  {/* Sort Filter */}
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
                            : "Tarihe Göre"}
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
                            <span>Tarihe Göre</span>
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

                  {/* Message Count Filter */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsMessageCountDropdownOpen(!isMessageCountDropdownOpen)}
                      className="pl-9 pr-8 py-2 bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer min-w-[180px] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <ChatCircle
                          className="w-4 h-4 text-gray-400"
                          weight="regular"
                        />
                        <span>
                          {messageCountFilter === "all"
                            ? "Mesaj Sayısı"
                            : messageCountFilter === "min10"
                            ? "En Az 10 Mesaj"
                            : messageCountFilter === "min20"
                            ? "En Az 20 Mesaj"
                            : "En Az 50 Mesaj"}
                        </span>
                      </div>
                      <CaretDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          isMessageCountDropdownOpen ? "rotate-180" : ""
                        }`}
                        weight="bold"
                      />
                    </button>

                    {/* Message Count Dropdown Menu */}
                    {isMessageCountDropdownOpen && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => {
                            setIsMessageCountDropdownOpen(false);
                          }}
                        />
                        {/* Dropdown Options */}
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl border-2 border-gray-200 shadow-lg z-20 overflow-hidden min-w-[200px]">
                          <button
                            type="button"
                            onClick={() => {
                              setMessageCountFilter("all");
                              setIsMessageCountDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                              messageCountFilter === "all"
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>Tüm Mesaj Sayıları</span>
                            {messageCountFilter === "all" && (
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
                              setMessageCountFilter("min10");
                              setIsMessageCountDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                              messageCountFilter === "min10"
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>En Az 10 Mesaj</span>
                            {messageCountFilter === "min10" && (
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
                              setMessageCountFilter("min20");
                              setIsMessageCountDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                              messageCountFilter === "min20"
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>En Az 20 Mesaj</span>
                            {messageCountFilter === "min20" && (
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
                              setMessageCountFilter("min50");
                              setIsMessageCountDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                              messageCountFilter === "min50"
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>En Az 50 Mesaj</span>
                            {messageCountFilter === "min50" && (
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

                  {/* Date Filter - Only show for regular classes, not "other-students" */}
                  {classId !== "other-students" && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsDateDropdownOpen(!isDateDropdownOpen)
                        }
                        className="pl-9 pr-8 py-2 bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer min-w-[180px] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar
                            className="w-4 h-4 text-gray-400"
                            weight="regular"
                          />
                          <span>
                            {dateFilter === "all"
                              ? "Tüm Zamanlar"
                              : dateFilter === "today"
                              ? "Bugün"
                              : dateFilter === "thisWeek"
                              ? "Bu Hafta"
                              : dateFilter === "thisMonth"
                              ? "Bu Ay"
                              : "Özel Aralık"}
                          </span>
                        </div>
                        <CaretDown
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                            isDateDropdownOpen ? "rotate-180" : ""
                          }`}
                          weight="bold"
                        />
                      </button>

                      {/* Date Filter Dropdown Menu */}
                      {isDateDropdownOpen && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => {
                              setIsDateDropdownOpen(false);
                            }}
                          />
                          {/* Dropdown Options */}
                          <div className="absolute top-full right-0 mt-2 bg-white rounded-xl border-2 border-gray-200 shadow-lg z-20 overflow-hidden min-w-[200px]">
                            <button
                              type="button"
                              onClick={() => {
                                setDateFilter("all");
                                setIsDateDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                                dateFilter === "all"
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span>Tüm Zamanlar</span>
                              {dateFilter === "all" && (
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
                                setDateFilter("today");
                                setIsDateDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                                dateFilter === "today"
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span>Bugün</span>
                              {dateFilter === "today" && (
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
                                setDateFilter("thisWeek");
                                setIsDateDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                                dateFilter === "thisWeek"
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span>Bu Hafta</span>
                              {dateFilter === "thisWeek" && (
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
                                setDateFilter("thisMonth");
                                setIsDateDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                                dateFilter === "thisMonth"
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span>Bu Ay</span>
                              {dateFilter === "thisMonth" && (
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
                                setDateFilter("custom");
                                setIsDateDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-150 flex items-center justify-between ${
                                dateFilter === "custom"
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span>Özel Aralık</span>
                              {dateFilter === "custom" && (
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
                  )}
                </div>
              </div>

              {/* Custom Date Picker - Always show when custom range is selected */}
              {dateFilter === "custom" && (
                <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Başlangıç Tarihi
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bitiş Tarihi
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        min={customStartDate}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Students List */}
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
                {!loading && students.length === 0 && (
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
                      Henüz öğrenci yok
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Bu sınıfa henüz hiç öğrenci eklenmemiş.
                    </p>
                  </div>
                )}

                {/* No Results State */}
                {!loading &&
                  students.length > 0 &&
                  filteredStudents.length === 0 && (
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
                        &quot;{searchQuery}&quot; için eşleşen öğrenci
                        bulunamadı.
                      </p>
                    </div>
                  )}

                {/* Students Cards */}
                {!loading &&
                  filteredStudents.map((student) => (
                    <Link
                      key={student.user_id}
                      href={`/admin/student?studentId=${student.user_id}`}
                      className="block bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {/* Student Avatar */}
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {student.display_name?.charAt(0).toUpperCase() ||
                              student.email?.charAt(0).toUpperCase() ||
                              "S"}
                          </span>
                        </div>

                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-semibold text-gray-800 truncate"
                            title={student.display_name || "İsimsiz Öğrenci"}
                          >
                            {student.display_name || "İsimsiz Öğrenci"}
                          </h3>
                          <p
                            className="text-sm text-gray-600 truncate"
                            title={student.email}
                          >
                            {student.email}
                          </p>
                          {student.total_conversations > 0 && (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                                <span className="text-xs text-blue-600 font-medium">
                                  {student.total_conversations} konuşma
                                </span>
                              </div>
                              {student.last_message_date && (
                                <span className="text-xs text-gray-500">
                                  • Son mesaj:{" "}
                                  {new Date(
                                    student.last_message_date
                                  ).toLocaleDateString("tr-TR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Role Badge and Arrow */}
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            {student.role === "student"
                              ? "Öğrenci"
                              : student.role}
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
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

export default function ClassDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ClassDetailPageContent />
    </Suspense>
  );
}
