"use client";

import { useState, useEffect, Suspense } from "react";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import {
  StudentService,
  StudentDetail,
  StudentMessage,
  StudentStats,
  StudentBotDistribution,
  StudentMessageTrend,
} from "@/lib/student-service";
import { BatchService } from "@/lib/batch-service";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
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
import {
  Robot,
  Leaf,
  Drop,
  Plant,
  ChartLineUp,
  DownloadSimple,
  ArrowLeft,
  Calendar,
  User,
  Smiley,
  ChatCircleText,
  Quotes,
  CheckCircle,
  WarningCircle,
  Info,
  Clock,
  DotsThreeCircle,
  SelectionAll,
} from "@phosphor-icons/react";

function StudentDetailPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");

  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(
    null,
  );
  const [selectedBot, setSelectedBot] = useState<number | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<
    "csv" | "json" | "txt" | "xlsx"
  >("xlsx");
  const [messageFilter, setMessageFilter] = useState<"all" | "student" | "evaluated">(
    "all",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Statistics state
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [botDistribution, setBotDistribution] = useState<
    StudentBotDistribution[]
  >([]);
  const [messageTrend, setMessageTrend] = useState<StudentMessageTrend[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Batch/Evaluator state
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedEval, setSelectedEval] = useState<any | null>(null);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);

  const fetchStudentDetail = async () => {
    console.log("fetchStudentDetail called with:", { user: !!user, studentId });

    if (!user || !studentId) {
      console.log("Missing user or studentId, setting loading false");
      setLoading(false);
      setStatsLoading(false);
      return;
    }

    try {
      console.log("Starting to fetch student detail for:", studentId);
      setLoading(true);
      setStatsLoading(true);
      setError(null);

      // Fetch student detail
      const detail = await StudentService.getStudentDetail(studentId);
      console.log("Student detail result:", detail);
      setStudentDetail(detail);

      // Set the first bot as selected by default (instead of "all")
      if (
        detail &&
        detail.bot_interactions &&
        detail.bot_interactions.length > 0
      ) {
        // Find the bot with most messages or just the first one
        setSelectedBot(detail.bot_interactions[0].bot_index);
      }

      // Fetch statistics in parallel
      const [stats, botDist, trend] = await Promise.all([
        StudentService.getStudentStats(studentId),
        StudentService.getStudentBotDistribution(studentId),
        StudentService.getStudentMessageTrend(studentId, 30),
      ]);

      console.log("Statistics fetched:", { stats, botDist, trend });
      setStudentStats(stats);
      setBotDistribution(botDist);
      setMessageTrend(trend);

      // Fetch batch data (evaluations and reports)
      try {
        const [evals, studentReports] = await Promise.all([
          BatchService.getStudentEvaluations(studentId),
          BatchService.getStudentReports(studentId),
        ]);
        setEvaluations(evals);
        setReports(studentReports);
      } catch (batchErr) {
        console.warn("Batch data fetch error:", batchErr);
      }
    } catch (err) {
      console.error("Error fetching student detail:", err);
      console.log("Setting error state");
      setError("Öğrenci detayları yüklenirken bir hata oluştu");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDetail();
  }, [user, studentId]);

  // Redirect if no studentId
  useEffect(() => {
    if (!studentId) {
      router.push("/admin/classes");
    }
  }, [studentId, router]);

  const handleDownload = () => {
    if (!studentDetail) return;

    if (selectedBot === null) return;

    // Download messages for selected bot only
    const botInteraction = studentDetail.bot_interactions.find(
      (bot) => bot.bot_index === selectedBot,
    );
    if (botInteraction) {
      StudentService.downloadConversation(
        botInteraction.conversations,
        selectedFormat,
        messageFilter === "student",
      );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Bilinmiyor";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBotDisplayName = (botIndex: number) => {
    const botNames = ["Yaprak", "Robi", "Buğday", "Damla"];
    return botNames[botIndex] || `Bot ${botIndex}`;
  };

  const getBotColor = (botIndex: number) => {
    const colors = [
      "bg-green-500",
      "bg-blue-500",
      "bg-yellow-500",
      "bg-cyan-500",
    ];
    return colors[botIndex] || "bg-gray-500";
  };

  const getBotGradient = (botIndex: number) => {
    const gradients = [
      "from-green-400 to-emerald-500", // Yaprak
      "from-yellow-400 to-orange-500", // Robi
      "from-amber-400 to-yellow-500", // Buğday
      "from-blue-400 to-cyan-500", // Damla
    ];
    return gradients[botIndex] || "from-gray-400 to-gray-500";
  };

  const getBotImage = (botIndex: number) => {
    const images = [
      "/bot/yaprak.jpeg",
      "/bot/robi.jpeg",
      "/bot/bugday.jpeg",
      "/bot/damla.jpeg",
    ];
    return images[botIndex] || "/bot/yaprak.jpeg";
  };

  const getBotIcon = (botIndex: number, size = 20, weight: any = "bold") => {
    switch (botIndex) {
      case 0:
        return <Leaf size={size} weight={weight} />;
      case 1:
        return <Robot size={size} weight={weight} />;
      case 2:
        return <Plant size={size} weight={weight} />;
      case 3:
        return <Drop size={size} weight={weight} />;
      default:
        return <DotsThreeCircle size={size} weight={weight} />;
    }
  };

  const getMessageEval = (messageId: string) => {
    return evaluations.find((e) => e.message_id === messageId);
  };

  if (loading) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
          <AdminSidebar currentPage={null} />
          <div className="lg:ml-64">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Öğrenci detayları yükleniyor...</p>
              </div>
            </div>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  if (error || !studentDetail) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
          <AdminSidebar currentPage={null} />
          <div className="lg:ml-64">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L17.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2 1.732 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Hata
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {error || "Öğrenci bulunamadı"}
                </p>
                <button
                  onClick={() => {
                    if (window.history.length > 2) {
                      router.back();
                    } else {
                      router.push("/admin/batch");
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Geri Dön
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  const currentBotInteraction = studentDetail.bot_interactions.find(
    (bot) => bot.bot_index === selectedBot,
  );
  const allMessages = currentBotInteraction?.conversations || [];
  const currentMessages = allMessages.filter((msg) => {
    if (messageFilter === "student") return msg.is_user;
    if (messageFilter === "evaluated") return !!getMessageEval(msg.id);
    return true;
  });

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
        <AdminSidebar currentPage={null} />

        {/* Main Content */}
        <div className="lg:ml-64">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (window.history.length > 2) {
                      router.back();
                    } else {
                      router.push("/admin/batch");
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-400 hover:text-blue-600 border border-transparent hover:border-gray-200 shadow-sm hover:shadow"
                >
                  <ArrowLeft size={20} weight="bold" />
                </button>
                <div>
                  <h1 className="text-xl font-black text-gray-800 tracking-tight uppercase">
                    {studentDetail.display_name || "Öğrenci"}{" "}
                    <span className="font-medium lowercase text-gray-400 font-serif italic text-base">
                      analiz raporu
                    </span>
                  </h1>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider border border-blue-100">
                      <User size={10} weight="fill" />
                      {studentDetail.class_name || "Sınıf Belirtilmedi"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-black uppercase tracking-wider border border-gray-100">
                      <ChatCircleText size={10} weight="fill" />
                      {studentDetail.total_messages} Mesaj Kaydı
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                    Genel Katılım
                  </span>
                  <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (studentDetail.total_messages / 50) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content - Full Height Layout */}
          <div className="px-6 pb-24 lg:pb-8 pt-4 h-full">
            <div className="max-w-sm lg:max-w-6xl mx-auto h-full flex flex-col">
              {/* Charts Section */}
              <div className="mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Message Trend Chart */}
                  <div className="bg-white/80 rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Mesaj Trendi
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Son 30 günde öğrencinin günlük mesaj sayısı
                    </p>
                    {statsLoading ? (
                      <div className="h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : messageTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={messageTrend as any}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
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
                            itemStyle={{ color: "#3b82f6" }}
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
                      Öğrencinin hangi botlarla konuştuğu
                    </p>
                    {statsLoading ? (
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
                              props: any,
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

              {/* Pedagogical Analysis Card (Kişi Analizi) */}
              {reports.length > 0 && (
                <div className="mb-6 bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 group">
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Left Panel: Score and Quick Summary */}
                    <div className="lg:col-span-4 bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 p-8 text-white relative overflow-hidden">
                      {/* Decorative elements */}
                      <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>

                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <ChartLineUp size={20} weight="bold" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">
                            PEDAGOJİK ANALİZ
                          </span>
                        </div>

                        <div className="mb-8">
                          <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest block mb-2">
                            Genel Gelişim Skoru
                          </span>
                          <div className="flex items-end gap-2">
                            <span className="text-6xl font-black leading-none">
                              {reports[0].overall_score}
                            </span>
                            <span className="text-xl font-bold text-blue-300 mb-1">
                              / 10
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm transition-all hover:bg-white/20">
                            <div className="flex items-center gap-2">
                              <Smiley
                                size={18}
                                weight="duotone"
                                className="text-blue-200"
                              />
                              <span className="text-xs font-bold text-blue-50">
                                Katılım Düzeyi
                              </span>
                            </div>
                            <span className="text-xs font-black bg-blue-500/50 px-2 py-1 rounded-lg uppercase">
                              {reports[0].llm_evaluation?.engagement_level ||
                                "Orta"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm transition-all hover:bg-white/20">
                            <div className="flex items-center gap-2">
                              <ChartLineUp
                                size={18}
                                weight="duotone"
                                className="text-blue-200"
                              />
                              <span className="text-xs font-bold text-blue-50">
                                Gelişim Trendi
                              </span>
                            </div>
                            <span className="text-xs font-black bg-emerald-500/50 px-2 py-1 rounded-lg uppercase">
                              {reports[0].stats?.trend || "Stabil"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm transition-all hover:bg-white/20">
                            <div className="flex items-center gap-2">
                              <Info
                                size={18}
                                weight="duotone"
                                className="text-blue-200"
                              />
                              <span className="text-xs font-bold text-blue-50">
                                İlgi Odağı
                              </span>
                            </div>
                            <span className="text-xs font-black bg-amber-500/50 px-2 py-1 rounded-lg uppercase truncate max-w-[100px]">
                              {reports[0].llm_evaluation
                                ?.most_interested_topic || "Bilinmiyor"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Detailed Feedback */}
                    <div className="lg:col-span-8 p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">
                            EĞİTİMCİ ÖZETİ & GERİ BİLDİRİM
                          </h3>
                        </div>

                        <div className="relative">
                          <Quotes
                            size={48}
                            weight="fill"
                            className="absolute -top-4 -left-4 text-gray-50 opacity-50"
                          />
                          <p className="text-gray-600 leading-relaxed text-sm relative z-10 pl-2">
                            {reports[0].llm_evaluation?.summary_paragraph ||
                              "Öğrenci etkileşimleri üzerinden henüz detaylı bir özet oluşturulamadı."}
                          </p>
                        </div>

                        <div className="mt-8">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                            KONU BAŞLIKLARI
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {reports[0].llm_evaluation?.conversation_themes?.map(
                              (theme: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-3 py-1.5 bg-gray-50 text-gray-500 text-xs font-bold rounded-xl border border-gray-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors cursor-default"
                                >
                                  {theme}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* Chat Messages - Sidebar Layout */}
              <div className="bg-white/80 rounded-3xl border border-gray-200 shadow-xl flex-1 flex flex-row overflow-hidden min-h-[700px]">
                
                {/* Left Sidebar: Controls */}
                <div className="w-80 border-r border-gray-100 bg-gray-50/50 flex flex-col p-6 space-y-8 overflow-y-auto">
                  
                  {/* Robot Selection */}
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">ROBOT SEÇİMİ</h3>
                    <div className="flex flex-col gap-3">
                      {studentDetail.bot_interactions.map((bot) => (
                        <button
                          key={bot.bot_index}
                          onClick={() => setSelectedBot(bot.bot_index)}
                          className={`group relative flex items-center gap-4 p-3 rounded-2xl border-2 transition-all duration-300 ${
                            selectedBot === bot.bot_index
                              ? `border-blue-600 bg-white shadow-lg ring-4 ring-blue-50`
                              : "border-transparent bg-white/50 hover:bg-white hover:border-blue-200"
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl transition-colors ${
                            selectedBot === bot.bot_index
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                          }`}>
                            {getBotIcon(bot.bot_index, 20)}
                          </div>
                          <div className="flex flex-col items-start">
                            <span className={`text-sm font-black uppercase tracking-tight ${
                              selectedBot === bot.bot_index ? "text-blue-700" : "text-gray-600"
                            }`}>
                              {getBotDisplayName(bot.bot_index)}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              {bot.total_messages} Mesaj
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Filter */}
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">MESAJ FİLTRESİ</h3>
                    <div className="bg-gray-100 p-1.5 rounded-2xl flex flex-col gap-1">
                      <button
                        onClick={() => setMessageFilter("all")}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          messageFilter === "all"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Tümü
                      </button>
                      <button
                        onClick={() => setMessageFilter("student")}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          messageFilter === "student"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Sadece Öğrenci
                      </button>
                      <button
                        onClick={() => setMessageFilter("evaluated")}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          messageFilter === "evaluated"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Sadece Analizliler
                      </button>
                    </div>
                  </div>

                  {/* Download Controls */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">VERİYİ DIŞA AKTAR</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { setSelectedFormat("xlsx"); handleDownload(); }}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl hover:border-green-500 hover:text-green-600 transition-all group"
                      >
                         <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <DownloadSimple size={16} weight="bold" />
                         </div>
                         <span className="text-[10px] font-black text-gray-700 group-hover:text-inherit tracking-wide">XLSX</span>
                      </button>
                      
                      <button
                        onClick={() => { setSelectedFormat("csv"); handleDownload(); }}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl hover:border-blue-500 hover:text-blue-600 transition-all group"
                      >
                         <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <DownloadSimple size={16} weight="bold" />
                         </div>
                         <span className="text-[10px] font-black text-gray-700 group-hover:text-inherit tracking-wide">CSV</span>
                      </button>

                      <button
                        onClick={() => { setSelectedFormat("json"); handleDownload(); }}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl hover:border-purple-500 hover:text-purple-600 transition-all group"
                      >
                         <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <DownloadSimple size={16} weight="bold" />
                         </div>
                         <span className="text-[10px] font-black text-gray-700 group-hover:text-inherit tracking-wide">JSON</span>
                      </button>

                      <button
                        onClick={() => { setSelectedFormat("txt"); handleDownload(); }}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl hover:border-gray-400 hover:text-gray-900 transition-all group"
                      >
                         <div className="p-2 bg-gray-50 text-gray-500 rounded-lg group-hover:bg-gray-900 group-hover:text-white transition-colors">
                            <DownloadSimple size={16} weight="bold" />
                         </div>
                         <span className="text-[10px] font-black text-gray-700 group-hover:text-inherit tracking-wide">TXT</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Area: Chat Content */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                  {/* Chat Header */}
                  <div className="p-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${getBotGradient(selectedBot || 0)} text-white shadow-lg`}>
                          {getBotIcon(selectedBot || 0, 28, "fill")}
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">
                            {getBotDisplayName(selectedBot || 0)} <span className="font-medium lowercase text-gray-400 font-serif italic text-sm">ile diyalog</span>
                          </h2>
                          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase mt-0.5">
                            <ChatCircleText size={14} weight="fill" className="text-blue-400" />
                            {currentBotInteraction?.total_messages || 0} Mesaj Kaydı Bulundu
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 p-6 overflow-y-auto bg-gray-50/30">
                    <div className="max-w-4xl mx-auto space-y-6 pb-12">
                      {currentMessages.length === 0 ? (
                        <div className="text-center py-24">
                          <div className="w-24 h-24 bg-white rounded-full mx-auto mb-6 flex items-center justify-center shadow-sm border border-gray-100">
                            <ChatCircleText size={40} weight="duotone" className="text-gray-200" />
                          </div>
                          <p className="text-gray-400 font-medium italic">Bu bot ile henüz kayıtlı bir konuşma bulunmuyor.</p>
                        </div>
                      ) : (
                        currentMessages.map((message, index) => (
                          <div
                            key={message.id}
                            className={`flex ${message.is_user ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                          >
                            <div
                              className={`max-w-md lg:max-w-2xl px-6 py-4 rounded-3xl shadow-sm ${
                                message.is_user
                                  ? "bg-blue-600 text-white rounded-tr-none"
                                  : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                              }`}
                            >
                              {message.is_user ? (
                                <p className="text-sm font-medium leading-relaxed">{message.message}</p>
                              ) : (
                                <div className="text-sm prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-blue-900 prose-strong:font-black">
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                      em: ({ children }) => <em className="italic">{children}</em>,
                                      ul: ({ children }) => <ul className="list-disc list-outside mb-4 space-y-2 pl-4 text-gray-600">{children}</ul>,
                                      ol: ({ children }) => <ol className="list-decimal list-outside mb-4 space-y-2 pl-4 text-gray-600">{children}</ol>,
                                      li: ({ children }) => <li className="text-sm">{children}</li>,
                                      h1: ({ children }) => <h1 className="text-xl font-black mb-4 text-gray-900">{children}</h1>,
                                      h2: ({ children }) => <h2 className="text-lg font-black mb-3 text-gray-900">{children}</h2>,
                                      h3: ({ children }) => <h3 className="text-base font-black mb-2 text-gray-900">{children}</h3>,
                                      code: ({ children }) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-blue-600">{children}</code>,
                                      blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-200 pl-4 py-1 italic text-gray-500 bg-blue-50/30 rounded-r-xl mb-4">{children}</blockquote>,
                                    }}
                                  >
                                    {message.message}
                                  </ReactMarkdown>
                                </div>
                              )}
                              <div className={`text-[10px] mt-3 font-bold uppercase tracking-wider ${
                                message.is_user ? "text-blue-100/70 flex justify-between gap-4 items-center" : "text-gray-400 border-t border-gray-50 pt-2 flex justify-between"
                              }`}>
                                <span className="flex items-center gap-1.5">
                                  <Clock size={12} weight="bold" />
                                  {formatDate(message.created_at)}
                                </span>
                                {message.is_user && getMessageEval(message.id) && (
                                  <span className="flex items-center gap-2 bg-white/20 px-2 py-1 rounded-xl backdrop-blur-sm border border-white/10 group cursor-pointer"
                                     onClick={() => {
                                        setSelectedEval(getMessageEval(message.id));
                                        setIsEvalModalOpen(true);
                                      }}
                                  >
                                    <span className="flex gap-1.5">
                                      <span>İÇERİK:{getMessageEval(message.id)?.scores?.content}</span>
                                      <span className="opacity-40">|</span>
                                      <span>DİYALOG:{getMessageEval(message.id)?.scores?.dialog}</span>
                                    </span>
                                    <div className="bg-white text-blue-600 p-0.5 rounded-full group-hover:scale-110 transition-transform">
                                      <Info size={10} weight="fill" />
                                    </div>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Detay Modalı */}
                <EvalDetailModal 
                  isOpen={isEvalModalOpen} 
                  onClose={() => setIsEvalModalOpen(false)} 
                  evaluation={selectedEval}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>

  );
}

// Analiz Detay Modalı
function EvalDetailModal({
  isOpen,
  onClose,
  evaluation,
}: {
  isOpen: boolean;
  onClose: () => void;
  evaluation: any;
}) {
  if (!isOpen || !evaluation) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl scale-in-center border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Detaylı Mesaj Analizi</h3>
            <p className="text-xs text-blue-100 opacity-80 mt-1">
              Yapay Zeka Değerlendirme Çıktısı
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg
              className="w-6 h-6"
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
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* İçerik Puanı */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                İçerik (Content)
              </span>
              <span className="text-sm font-bold text-gray-800">
                Skor: {evaluation.scores?.content}/3
              </span>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
              {evaluation.scores?.content_reasoning ||
                evaluation.feedback ||
                "Gerekçe belirtilmedi."}
            </p>
          </div>

          {/* Diyalog Puanı */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                Diyalog (Dialog)
              </span>
              <span className="text-sm font-bold text-gray-800">
                Seviye: {evaluation.scores?.dialog}
              </span>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
              {evaluation.scores?.dialog_reasoning || "Gerekçe belirtilmedi."}
            </p>
          </div>

          {/* Özellikler */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Tespit Edilen Belirtiler
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Kelime Sayısı",
                  val: evaluation.scores?.features?.word_count,
                },
                {
                  label: "Bilgi Bağlantısı",
                  val: evaluation.scores?.features?.has_connection
                    ? "Evet"
                    : "Hayır",
                },
                {
                  label: "Akıl Yürütme",
                  val: evaluation.scores?.features?.has_reasoning
                    ? "Evet"
                    : "Hayır",
                },
                {
                  label: "Kısa Yanıt",
                  val: evaluation.scores?.features?.is_minimal
                    ? "Evet"
                    : "Hayır",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-gray-500">{f.label}:</span>
                  <span className="font-semibold text-gray-800">{f.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <StudentDetailPageContent />
    </Suspense>
  );
}
