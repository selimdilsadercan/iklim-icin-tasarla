"use client";

import { useState, useEffect } from "react";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import {
  DashboardStatsService,
  BotDistribution,
  MessageTrend,
} from "@/lib/dashboard-stats-service";
import AdminAppBar from "@/components/AdminAppBar";
import AdminSidebar from "@/components/AdminSidebar";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface AdminStats {
  totalClasses: number;
  totalStudents: number;
  totalInteractions: number;
}

export default function AdminHomePage() {
  const { user, loading: authLoading, isAdmin, isTeacher } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalClasses: 0,
    totalStudents: 0,
    totalInteractions: 0,
  });
  const [botDistribution, setBotDistribution] = useState<BotDistribution[]>([]);
  const [messageTrend, setMessageTrend] = useState<MessageTrend[]>([]);
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

      // Fetch dashboard stats using the new SQL function
      const dashboardStats = await DashboardStatsService.getDashboardStats(
        user.id
      );

      if (dashboardStats) {
        setStats({
          totalClasses: dashboardStats.total_classes,
          totalStudents: dashboardStats.total_students,
          totalInteractions: dashboardStats.total_conversations,
        });
      } else {
        // Fallback to zero values if no stats returned
        setStats({
          totalClasses: 0,
          totalStudents: 0,
          totalInteractions: 0,
        });
      }

      // Fetch bot distribution
      const botDist = await DashboardStatsService.getBotDistribution(user.id);
      setBotDistribution(botDist);

      // Fetch message trend (last 30 days)
      const trend = await DashboardStatsService.getMessageTrend(user.id, 30);
      setMessageTrend(trend);

      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      setError("İstatistikler yüklenirken bir hata oluştu");

      // Auto-retry logic
      if (retryCount < 3) {
        console.log(`Retrying fetchStats, attempt ${retryCount + 1}`);
        setRetryCount((prev) => prev + 1);
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
        console.log("Page became visible, refreshing stats");
        fetchStats();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, authLoading]);

  // Fallback: if auth loading is done but we're still in loading state for too long, stop loading
  useEffect(() => {
    if (!authLoading && user && loading) {
      const timeout = setTimeout(() => {
        console.log("Loading timeout - stopping loading state");
        setLoading(false);
        setError("Yükleme zaman aşımına uğradı. Lütfen sayfayı yenileyin.");
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
          <div className="max-w-sm lg:max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Kontrol Paneli Genel Bakışı
              </h1>
              <p className="text-gray-600">
                {isAdmin
                  ? "Yönetici paneli ve sistem istatistikleri"
                  : "Öğretmen paneli ve sistem istatistikleri"}
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
                        <svg
                          className="w-6 h-6 text-blue-600"
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
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-600">
                          Sınıflar
                        </h3>
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
                        <svg
                          className="w-6 h-6 text-blue-600"
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
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-600">
                          Öğrenciler
                        </h3>
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
                        <svg
                          className="w-6 h-6 text-blue-600"
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
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-600">
                          Toplam Mesajlar
                        </h3>
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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Message Trend Chart */}
              <div className="bg-white/80 rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Mesaj Trendi
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Son 30 günde öğrencilerinizin günlük mesaj sayısı
                </p>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : messageTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={messageTrend as any}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `${value} mesaj`,
                          "Mesaj Sayısı",
                        ]}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          const dayName = date.toLocaleDateString("tr-TR", {
                            weekday: "long",
                          });
                          const dateStr = date.toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          });
                          return `${dateStr}, ${dayName}`;
                        }}
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        labelStyle={{
                          color: "#1f2937",
                          fontWeight: "500",
                          marginBottom: "4px",
                        }}
                        itemStyle={{
                          color: "#3b82f6",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="message_count"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", r: 4 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <p>Henüz mesaj verisi bulunmuyor</p>
                  </div>
                )}
              </div>

              {/* Bot Distribution Chart */}
              <div className="bg-white/80 rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Bot Dağılımı
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Öğrencilerinizin en çok hangi botlarla konuştuğunu
                  görüntüleyin
                </p>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : botDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={botDistribution as any}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        label={(entry: any) =>
                          `${entry.bot_name}: ${entry.percentage}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="conversation_count"
                        isAnimationActive={false}
                      >
                        {botDistribution.map((entry, index) => {
                          const colors = [
                            "#10b981", // Green for Yaprak
                            "#3b82f6", // Blue for Robi
                            "#f59e0b", // Orange for Buğday
                            "#8b5cf6", // Purple for Damla
                          ];
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={colors[entry.bot_index] || "#94a3b8"}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip
                        formatter={(
                          value: number,
                          name: string,
                          props: any
                        ) => [
                          `${value} konuşma (${props.payload.percentage}%)`,
                          props.payload.bot_name,
                        ]}
                      />
                      <Legend
                        formatter={(value, entry: any) =>
                          `${entry.payload.bot_name}: ${entry.payload.percentage}%`
                        }
                        wrapperStyle={{ fontSize: "12px" }}
                        iconSize={10}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <p>Henüz konuşma verisi bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
