"use client";

import React, { useState, useEffect } from "react";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import AdminSidebar from "@/components/AdminSidebar";
import AdminAppBar from "@/components/AdminAppBar";
import { BatchService, BatchJob, AnalysisGroup } from "@/lib/batch-service";
import Link from "next/link";
import {
  TeacherClassesService,
  TeacherClass,
} from "@/lib/teacher-classes-service";
import {
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Spinner,
  Users,
  Plus,
  PencilSimple,
  Trash,
  SkipForwardCircleIcon,
  CaretDown,
  CaretUp,
  TrendUp,
  Trophy,
  Quotes,
  User,
  ChartBar,
  ArrowSquareOut,
  WarningCircle,
  ArrowClockwise,
  FolderSimplePlus,
  Files,
  ArrowRight,
} from "@phosphor-icons/react";

export default function BatchAdminPage() {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workerRunning, setWorkerRunning] = useState(false);
  const [isStartingWorker, setIsStartingWorker] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<BatchJob | null>(null);

  // Modal Local States
  const [selectedClass, setSelectedClass] = useState("");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isCreating, setIsCreating] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (jobId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [analysisGroups, setAnalysisGroups] = useState<AnalysisGroup[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  // Edit modal local states
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // İşleri çekme
  const fetchInitialData = async () => {
    try {
      const [jobsData, classesData, workerData, groupsData] = await Promise.all(
        [
          BatchService.listJobs(),
          TeacherClassesService.getTeacherClasses(),
          BatchService.getWorkerStatus(),
          BatchService.listGroups(),
        ],
      );
      setJobs(jobsData);
      setClasses(classesData);
      setWorkerRunning(workerData.worker_running);
      setAnalysisGroups(groupsData);
    } catch (e) {
      console.error("Initial fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await BatchService.listJobs();
      setJobs(data);
    } catch (error) {
      console.error("Jobs fetch error:", error);
    }
  };

  // Sınıfları çekme (Modal için)
  const fetchClasses = async () => {
    try {
      const data = await TeacherClassesService.getTeacherClasses();
      setClasses(data);
    } catch (error) {
      console.error("Classes fetch error:", error);
    }
  };

  // Worker durumunu çekme
  const fetchWorkerStatus = async () => {
    try {
      const { worker_running } = await BatchService.getWorkerStatus();
      setWorkerRunning(worker_running);
    } catch (error) {
      console.error("Worker status fetch error:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(() => {
      fetchJobs();
      fetchWorkerStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateJob = async () => {
    if (!selectedClass) return alert("Lütfen bir sınıf seçin!");

    setIsCreating(true);
    try {
      const students =
        await TeacherClassesService.getClassStudents(selectedClass);
      const studentIds = students.map((s) => s.user_id);

      if (studentIds.length === 0) {
        alert("Bu sınıfta öğrenci bulunamadı!");
        return;
      }

      await BatchService.createJob({
        studentIds,
        classId: selectedClass,
        startDate,
        endDate,
      });

      setIsModalOpen(false);
      fetchJobs();
    } catch (error) {
      console.error("Create job error:", error);
      alert("İş başlatılamadı!");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRetryFallbacks = async (job: BatchJob) => {
    if (!job.participants) return;

    // Güçlendirilmiş kontrol: Hem sayıyı garanti et hem de skorsuzları al
    const failedStudentIds = job.participants
      .filter((p) => {
        const fCount = Number(p.fallback_count || 0);
        return fCount > 0 || !p.score;
      })
      .map((p) => p.user_id);

    // Eğer spesifik öğrenci bulunamadıysa ama global hata varsa, tüm öğrencileri veya config'deki listeyi dene
    let targetIds = failedStudentIds;
    let message = `${failedStudentIds.length} öğrenci için analiz tekrar başlatılsın mı?`;

    if (targetIds.length === 0 && Number(job.fallback_count || 0) > 0) {
      targetIds = job.config.student_ids || [];
      message = `Hatalı analizler tam olarak ayrıştırılamadı. Tüm sınıfın (${targetIds.length} öğrenci) analizini yeniden başlatmak ister misiniz?`;
    }

    if (targetIds.length === 0) {
      alert("Yeniden denenecek hatalı analiz bulunamadı.");
      return;
    }

    if (!confirm(message)) return;

    try {
      await BatchService.createJob({
        studentIds: targetIds,
        classId: job.config.class_id || "",
        startDate: job.config.start_date,
        endDate: job.config.end_date,
      });
      alert("Yeniden analiz işlemi sıraya alındı.");
      fetchJobs();
    } catch (error) {
      console.error("Retry fallbacks error:", error);
      alert("İşlem başlatılamadı!");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Bu analiz işini silmek istediğinize emin misiniz?")) return;

    try {
      await BatchService.deleteJob(jobId);
      fetchJobs();
    } catch (error) {
      console.error("Delete job error:", error);
      alert("İş silinemedi!");
    }
  };

  const handleOpenEditModal = (job: BatchJob) => {
    setEditingJob(job);
    setEditStartDate(job.config.start_date);
    setEditEndDate(job.config.end_date);
    setIsEditModalOpen(true);
  };

  const handleUpdateJob = async () => {
    if (!editingJob) return;
    setIsSaving(true);
    try {
      await BatchService.updateJob(editingJob.id, {
        startDate: editStartDate,
        endDate: editEndDate,
      });
      setIsEditModalOpen(false);
      setEditingJob(null);
      fetchJobs();
    } catch (error) {
      console.error("Update job error:", error);
      alert("İş güncellenemedi!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName) return;
    setIsCreatingGroup(true);
    try {
      const newGroup = await BatchService.createGroup({
        name: groupName,
        description: groupDescription,
        jobIds: Array.from(selectedJobIds),
      });
      setAnalysisGroups([newGroup, ...analysisGroups]);
      setIsGroupModalOpen(false);
      setGroupName("");
      setGroupDescription("");
      setSelectedJobIds(new Set());
    } catch (e) {
      console.error("Grup oluşturma hatası:", e);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Bu grubu silmek istediğinize emin misiniz?")) return;
    try {
      await BatchService.deleteGroup(id);
      setAnalysisGroups(analysisGroups.filter((g) => g.id !== id));
    } catch (e) {
      console.error("Grup silme hatası:", e);
    }
  };

  const handleStartWorker = async () => {
    setIsStartingWorker(true);
    try {
      await BatchService.startWorker();
      fetchWorkerStatus();
      alert("Analiz Worker'ı başarıyla başlatıldı.");
    } catch (error) {
      console.error("Start worker error:", error);
      alert(
        "Worker başlatılamadı! Lütfen Evaluator servisinin (port 8000) açık olduğundan emin olun.",
      );
    } finally {
      setIsStartingWorker(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-gray-400" />;
      case "running":
        return <Spinner className="w-5 h-5 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50 text-gray-800">
        <AdminAppBar currentPage="batch" />
        <AdminSidebar currentPage="batch" />

        <div
          className="lg:ml-64 px-6 pb-24 lg:pb-8 pt-8 min-h-screen"
          lang="tr"
        >
          <div className="max-w-sm lg:max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                BATCH DEĞERLENDİRME SİSTEMİ
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Öğrenci mesajlarını toplu olarak rubric kriterlerine göre akıllı
                asistan ile analiz edin.
              </p>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Clock weight="fill" className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-600">
                      Bekleyen/Çalışan
                    </h3>
                    <div className="text-2xl font-bold text-gray-900">
                      {
                        jobs.filter(
                          (j) =>
                            j.status === "pending" || j.status === "running",
                        ).length
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle
                      weight="fill"
                      className="w-6 h-6 text-green-600"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-600">
                      Tamamlanan
                    </h3>
                    <div className="text-2xl font-bold text-gray-900">
                      {jobs.filter((j) => j.status === "completed").length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users weight="fill" className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-600">
                      Kayıtlı Sınıf
                    </h3>
                    <div className="text-2xl font-bold text-gray-900">
                      {classes.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-gray-200">
                <div
                  className={`w-3 h-3 rounded-full ${workerRunning ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                />
                <span className="text-sm font-medium text-gray-700">
                  Analiz Worker: {workerRunning ? "Çalışıyor" : "Durduruldu"}
                </span>
                {!workerRunning && (
                  <button
                    onClick={handleStartWorker}
                    disabled={isStartingWorker}
                    className="ml-4 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-black transition-all disabled:opacity-50"
                  >
                    {isStartingWorker ? "Başlatılıyor..." : "Şimdi Başlat"}
                  </button>
                )}
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                {selectedJobIds.size > 0 && (
                  <>
                    <button
                      onClick={() => setIsGroupModalOpen(true)}
                      className="flex-1 md:flex-none bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                    >
                      <FolderSimplePlus weight="bold" className="w-5 h-5" />
                      Grup Yap ({selectedJobIds.size})
                    </button>
                    <button
                      onClick={() => {
                        const ids = Array.from(selectedJobIds).join(",");
                        window.location.href = `/admin/batch/report?jobIds=${ids}`;
                      }}
                      className="flex-1 md:flex-none bg-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                    >
                      <ChartBar weight="bold" className="w-5 h-5" />
                      Rapor Oluştur ({selectedJobIds.size})
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                  <Plus weight="bold" className="w-5 h-5" />
                  Yeni Analiz Başlat
                </button>
              </div>
            </div>

            {/* Groups Section */}
            {analysisGroups.length > 0 && (
              <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Files size={20} weight="fill" className="text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Kayıtlı Analiz Grupları
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysisGroups.map((group) => (
                    <div
                      key={group.id}
                      className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all relative overflow-hidden"
                    >
                      {/* Background Decoration */}
                      <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-50 rounded-full blur-xl group-hover:bg-amber-100 transition-colors" />

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteGroup(group.id);
                        }}
                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg"
                        title="Grubu Sil"
                      >
                        <Trash size={18} />
                      </button>

                      <div className="flex flex-col h-full relative z-10">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2.5 bg-gray-50 rounded-2xl group-hover:bg-amber-50 transition-colors">
                            <Files
                              size={24}
                              weight="bold"
                              className="text-gray-400 group-hover:text-amber-500"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 mb-0.5 truncate">
                              {group.name}
                            </h4>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              {new Date(group.created_at).toLocaleDateString(
                                "tr-TR",
                              )}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 mb-6 flex-1 line-clamp-2 leading-relaxed">
                          {group.description ||
                            "Bu grup için açıklama girilmemiş."}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-xs font-bold text-gray-600">
                              {group.job_ids.length} Analiz
                            </span>
                          </div>
                          <Link
                            href={`/admin/batch/report?groupId=${group.id}`}
                            className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-all hover:bg-blue-100 uppercase tracking-wider"
                          >
                            RAPORU AÇ
                            <ArrowRight weight="bold" className="mt-0.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Jobs Table Wrapper */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-100 bg-white/50">
                <h3 className="text-lg font-bold text-gray-800">
                  Son Analiz İşleri
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left table-fixed">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-wider border-b border-gray-100">
                      <th className="px-6 py-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={
                            selectedJobIds.size === jobs.length &&
                            jobs.length > 0
                          }
                          onChange={() => {
                            if (selectedJobIds.size === jobs.length) {
                              setSelectedJobIds(new Set());
                            } else {
                              setSelectedJobIds(new Set(jobs.map((j) => j.id)));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-900 w-16 text-center">
                        #
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-900 w-[25%]">
                        SINIF / ÖĞRETMEN
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-900 w-[20%]">
                        DURUM
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-900 w-[15%]">
                        KAPSAM
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-900 w-[20%]">
                        TARİH ARALIĞI
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-900 text-right w-32">
                        İŞLEMLER
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-600">
                    {jobs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-gray-400 italic"
                        >
                          Henüz bir batch job bulunmuyor.
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => {
                        const messageProgress =
                          (job.total_messages || 0) > 0
                            ? Math.round(
                                ((job.processed_messages || 0) /
                                  (job.total_messages || 1)) *
                                  100,
                              )
                            : job.status === "completed"
                              ? 100
                              : 0;

                        const isSkipped =
                          job.status === "completed" &&
                          (job.total_messages || 0) === 0;
                        const isExpanded = !!expandedRows[job.id];

                        return (
                          <React.Fragment key={job.id}>
                            <tr
                              className={`transition-all cursor-pointer group border-b border-gray-100 ${isExpanded ? "bg-blue-50/50" : "hover:bg-blue-50/20"} ${isSkipped ? "bg-amber-50/10" : ""} ${selectedJobIds.has(job.id) ? "bg-blue-50/80 hover:bg-blue-100/50" : ""}`}
                              onClick={() => toggleRow(job.id)}
                            >
                              <td
                                className="px-6 py-4 text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedJobIds.has(job.id)}
                                  onChange={() => toggleJobSelection(job.id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center">
                                  {isExpanded ? (
                                    <CaretUp
                                      weight="bold"
                                      className="w-4 h-4 text-blue-600"
                                    />
                                  ) : (
                                    <CaretDown
                                      weight="bold"
                                      className="w-4 h-4 text-gray-400 group-hover:text-blue-400"
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                                      {job.class_name || "Bilinmeyen Sınıf"}
                                    </span>
                                    {Number(job.fallback_count || 0) > 0 ? (
                                      <div
                                        className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 border border-red-100 rounded text-red-600 shadow-sm"
                                        title={`${job.fallback_count} mesaj yedek sistemle analiz edildi.`}
                                      >
                                        <WarningCircle
                                          size={10}
                                          weight="fill"
                                        />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">
                                          FALLBACK
                                        </span>
                                      </div>
                                    ) : null}
                                  </div>
                                  <span className="text-[10px] text-gray-500 flex items-center gap-1 truncate">
                                    <User
                                      size={12}
                                      weight="fill"
                                      className="text-blue-400 shrink-0"
                                    />
                                    <span className="truncate">
                                      {job.teacher_name || "Sistem"}
                                    </span>
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    {isSkipped ? (
                                      <SkipForwardCircleIcon
                                        weight="fill"
                                        className="w-4 h-4 text-amber-500"
                                      />
                                    ) : (
                                      getStatusIcon(job.status)
                                    )}
                                    <span
                                      className={`text-[10px] font-bold uppercase tracking-widest ${
                                        isSkipped
                                          ? "text-amber-600"
                                          : job.status === "completed"
                                            ? "text-green-600"
                                            : job.status === "running"
                                              ? "text-blue-600"
                                              : "text-gray-400"
                                      }`}
                                    >
                                      {isSkipped
                                        ? "SKIPPED"
                                        : job.status === "running"
                                          ? "ANALİZ EDİLİYOR"
                                          : job.status.toLocaleUpperCase(
                                              "tr-TR",
                                            )}
                                    </span>
                                  </div>
                                  <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                    <div
                                      className={`h-full transition-all duration-1000 ${
                                        isSkipped
                                          ? "bg-amber-400"
                                          : job.status === "completed"
                                            ? "bg-green-500"
                                            : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                      }`}
                                      style={{ width: `${messageProgress}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                                    <Users
                                      size={14}
                                      weight="bold"
                                      className="text-gray-400"
                                    />
                                    <Users
                                      size={14}
                                      weight="bold"
                                      className="text-gray-400"
                                    />
                                    {job.eligible_count || 0}
                                    <span className="text-[10px] text-gray-400 font-normal ml-0.5">
                                      Öğrenci
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                    <Quotes size={12} weight="fill" />
                                    <span>{job.total_messages || 0} Mesaj</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col text-[10px] text-gray-500">
                                  <div className="flex items-center gap-1 font-medium bg-gray-100/80 w-fit px-2 py-0.5 rounded-full mb-1 text-gray-700">
                                    <Clock size={12} />
                                    {job.config.start_date
                                      .split("-")
                                      .reverse()
                                      .join(".")}{" "}
                                    -{" "}
                                    {job.config.end_date
                                      .split("-")
                                      .reverse()
                                      .join(".")}
                                  </div>
                                  <span className="text-[9px] text-gray-400 ml-1">
                                    Kayıt:{" "}
                                    {new Date(
                                      job.created_at,
                                    ).toLocaleDateString("tr-TR")}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {job.status === "pending" ? (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditModal(job);
                                        }}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Düzenle"
                                      >
                                        <PencilSimple weight="bold" size={16} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteJob(job.id);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Sil"
                                      >
                                        <Trash weight="bold" size={16} />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 italic">
                                      {job.status === "completed"
                                        ? "Rapor Hazır"
                                        : "İşlemde"}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Detay Paneli (Expandable Area) */}
                            {isExpanded && (
                              <tr className="bg-blue-50/20">
                                <td
                                  colSpan={7}
                                  className="px-6 py-8 bg-gray-50/80 backdrop-blur-md rounded-b-2xl border-x border-b border-gray-100 shadow-inner"
                                >
                                  <div className="max-w-5xl mx-auto space-y-8">
                                    {/* Üst Kısım: Özet Kartlar */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                      {/* Ortalama Skor Kartı */}
                                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex items-center gap-3 mb-4">
                                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                            <ChartBar size={20} weight="fill" />
                                          </div>
                                          <span className="text-xs font-black text-gray-400 tracking-widest">
                                            SINIF ORTALAMASI
                                          </span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                          <span className="text-4xl font-black text-gray-900 leading-none">
                                            {job.avg_overall_score
                                              ? job.avg_overall_score.toFixed(1)
                                              : "0.0"}
                                          </span>
                                          <span className="text-sm font-bold text-gray-400">
                                            / 10
                                          </span>
                                        </div>
                                        <div className="mt-4 flex gap-4">
                                          <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-bold">
                                              İÇERİK
                                            </span>
                                            <span className="text-sm font-black text-gray-700">
                                              {job.avg_content_score?.toFixed(
                                                1,
                                              ) || "0.0"}
                                            </span>
                                          </div>
                                          <div className="w-px h-8 bg-gray-100"></div>
                                          <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-bold">
                                              TARTIŞMA
                                            </span>
                                            <span className="text-sm font-black text-gray-700">
                                              {job.avg_discussion_score?.toFixed(
                                                1,
                                              ) || "0.0"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* İşlem Özeti Kartı */}
                                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex items-center gap-3 mb-4">
                                          <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                                            <TrendUp size={20} weight="fill" />
                                          </div>
                                          <span className="text-xs font-black text-gray-400 tracking-widest">
                                            İŞLEM DETAYI
                                          </span>
                                        </div>
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-medium">
                                              Toplam Mesaj
                                            </span>
                                            <span className="font-black text-gray-900">
                                              {job.total_messages || 0}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-medium">
                                              Analiz Edilen
                                            </span>
                                            <span className="font-black text-gray-900">
                                              {job.processed_count || 0} Öğrenci
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-medium">
                                              İşlem Kapsamı
                                            </span>
                                            <span className="font-black text-blue-600">
                                              {job.eligible_count || 0} /{" "}
                                              {job.total_count || 0}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Durum Kartı */}
                                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md relative overflow-hidden">
                                        {Number(job.fallback_count || 0) >
                                          0 && (
                                          <div className="absolute -top-1 -right-1 w-16 h-16 bg-red-50 rounded-bl-full flex items-center justify-center pl-4 pb-4">
                                            <WarningCircle
                                              size={24}
                                              weight="fill"
                                              className="text-red-500"
                                            />
                                          </div>
                                        )}
                                        <div className="flex items-center gap-3 mb-4">
                                          <div
                                            className={`p-2 rounded-xl ${Number(job.fallback_count || 0) > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
                                          >
                                            {Number(job.fallback_count || 0) >
                                            0 ? (
                                              <WarningCircle
                                                size={20}
                                                weight="fill"
                                              />
                                            ) : (
                                              <CheckCircle
                                                size={20}
                                                weight="fill"
                                              />
                                            )}
                                          </div>
                                          <span className="text-xs font-black text-gray-400 tracking-widest">
                                            ANALİZ DURUMU
                                          </span>
                                        </div>
                                        <div className="flex flex-col h-full justify-between pb-2">
                                          <div className="flex flex-col gap-2">
                                            <span
                                              className={`w-fit px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${
                                                job.status === "completed"
                                                  ? "bg-green-100 text-green-700"
                                                  : job.status === "running"
                                                    ? "bg-blue-100 text-blue-700 animate-pulse"
                                                    : "bg-gray-100 text-gray-700"
                                              }`}
                                            >
                                              {job.status === "completed"
                                                ? "TAMAMLANDI"
                                                : job.status === "running"
                                                  ? `ANALİZ: ${(job.current_student_name || "BEKLENİYOR").toLocaleUpperCase("tr-TR")}`
                                                  : job.status.toLocaleUpperCase(
                                                      "tr-TR",
                                                    )}
                                            </span>
                                            {Number(job.fallback_count || 0) >
                                              0 && (
                                              <div className="space-y-2 mt-2">
                                                <p className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                                                  DİKKAT: {job.fallback_count}{" "}
                                                  Mesaj yapay zeka hatası
                                                  nedeniyle kural tabanlı
                                                  (fallback) analiz edildi.
                                                </p>
                                                <button
                                                  onClick={() =>
                                                    handleRetryFallbacks(job)
                                                  }
                                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black tracking-widest rounded-xl transition-all shadow-md active:scale-95"
                                                >
                                                  <ArrowClockwise
                                                    size={14}
                                                    weight="bold"
                                                  />
                                                  HATALARI YENİDEN ANALİZ ET
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                          <div className="mt-2 text-[10px] text-gray-400 font-medium leading-relaxed italic">
                                            Bu analiz{" "}
                                            {new Date(
                                              job.created_at,
                                            ).toLocaleDateString("tr-TR")}{" "}
                                            tarihinde başlatıldı.
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Alt Kısım: Öğrenci Listesi */}
                                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                      <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                          <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                                            <Users size={16} weight="bold" />
                                          </div>
                                          <h3 className="text-sm font-black text-gray-900 tracking-widest">
                                            ÖĞRENCİ ANALİZLERİ
                                          </h3>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400">
                                          MESAJ SAYISINA GÖRE SIRALANMIŞTIR
                                        </span>
                                      </div>
                                      <div className="overflow-hidden">
                                        <table className="w-full text-left">
                                          <thead>
                                            <tr className="bg-gray-50/50 text-[10px] text-gray-400 font-black uppercase tracking-wider border-b border-gray-100">
                                              <th className="px-6 py-3 w-16 text-center">
                                                DR
                                              </th>
                                              <th className="px-6 py-3">
                                                ÖĞRENCİ ADI
                                              </th>
                                              <th className="px-6 py-3 text-center">
                                                MESAJ
                                              </th>
                                              <th className="px-6 py-3 text-center">
                                                SKOR
                                              </th>
                                              <th className="px-6 py-3 text-right">
                                                EYLEM
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-50">
                                            {job.participants &&
                                            job.participants.length > 0 ? (
                                              job.participants.map(
                                                (participant, pIdx) => (
                                                  <tr
                                                    key={participant.user_id}
                                                    className="hover:bg-blue-50/30 transition-colors group"
                                                  >
                                                    <td className="px-6 py-4 text-center">
                                                      <span
                                                        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black ${
                                                          pIdx === 0
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : "bg-gray-100 text-gray-500"
                                                        }`}
                                                      >
                                                        {pIdx + 1}
                                                      </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                      <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                                          {participant.name.toLocaleUpperCase(
                                                            "tr-TR",
                                                          )}
                                                        </span>
                                                        {Number(
                                                          participant.fallback_count ||
                                                            0,
                                                        ) > 0 ? (
                                                          <span className="text-[9px] font-black text-red-500 flex items-center gap-1">
                                                            <WarningCircle
                                                              size={10}
                                                              weight="fill"
                                                            />
                                                            {
                                                              participant.fallback_count
                                                            }{" "}
                                                            MESAJ FALLBACK
                                                          </span>
                                                        ) : Number(
                                                            participant.count ||
                                                              0,
                                                          ) === 0 ? (
                                                          <span className="text-[9px] font-black text-gray-400 uppercase">
                                                            ANALİZ EDİLMEDİ
                                                          </span>
                                                        ) : null}
                                                      </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                      <span className="text-sm font-black text-gray-900">
                                                        {participant.count}
                                                      </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                      {participant.score ? (
                                                        <span
                                                          className={`px-2 py-1 rounded-lg text-xs font-black ${
                                                            participant.score >=
                                                            7
                                                              ? "bg-green-100 text-green-700"
                                                              : participant.score >=
                                                                  4
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : "bg-red-100 text-red-700"
                                                          }`}
                                                        >
                                                          {participant.score.toFixed(
                                                            1,
                                                          )}
                                                        </span>
                                                      ) : (
                                                        <span className="text-xs font-bold text-gray-300">
                                                          --
                                                        </span>
                                                      )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right leading-none">
                                                      <a
                                                        href={`/admin/student?studentId=${participant.user_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                                                      >
                                                        PROFİLİ AÇ
                                                        <ArrowSquareOut
                                                          size={14}
                                                          weight="bold"
                                                        />
                                                      </a>
                                                    </td>
                                                  </tr>
                                                ),
                                              )
                                            ) : (
                                              <tr>
                                                <td
                                                  colSpan={5}
                                                  className="px-6 py-12 text-center text-gray-400 italic text-sm"
                                                >
                                                  Henüz analiz edilmiş öğrenci
                                                  verisi bulunmuyor.
                                                </td>
                                              </tr>
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* New Job Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 text-gray-800">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">
                  Yeni Analiz Başlat
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle weight="bold" className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sınıf Seçin
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="">Lütfen seçin...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.student_count} Öğrenci)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-sm text-blue-800">
                  <Play
                    weight="fill"
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                  />
                  <p>
                    Bu analiz işlemi arka planda (Evaluator Worker)
                    çalıştırılacaktır. Sonuçları bu sayfadan takip
                    edebilirsiniz.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50/50 flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleCreateJob}
                  disabled={isCreating}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <Spinner className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play weight="fill" className="w-5 h-5" />
                  )}
                  Analizi Başlat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Job Modal */}
        {isEditModalOpen && editingJob && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 text-gray-800">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">
                  Analiz Düzenle
                </h2>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingJob(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle weight="bold" className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Job ID info */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    İş ID
                  </p>
                  <p className="font-mono text-sm text-gray-700">
                    #{editingJob.id.slice(0, 8)}
                  </p>
                </div>

                {/* Kapsam info (readonly) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kapsam
                  </label>
                  <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 text-sm">
                    {editingJob.config.student_ids?.length || 0} Öğrenci
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50/50 flex gap-3">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingJob(null);
                  }}
                  className="flex-1 px-4 py-3 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleUpdateJob}
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Spinner className="w-5 h-5 animate-spin" />
                  ) : (
                    <PencilSimple weight="bold" className="w-5 h-5" />
                  )}
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        {isGroupModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 text-gray-800">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <FolderSimplePlus className="text-amber-500" />
                  Yeni Analiz Grubu
                </h2>
                <button
                  onClick={() => setIsGroupModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle weight="bold" className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grup Adı
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Örn: 2024 Bahar Dönemi Tüm Sınıflar"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Grup hakkında detaylı bilgi..."
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300 resize-none"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-800 font-medium">
                    Seçilen{" "}
                    <span className="font-black underline">
                      {selectedJobIds.size} adet analiz
                    </span>{" "}
                    bu grup altında toplanacaktır.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50/50 flex gap-3">
                <button
                  onClick={() => setIsGroupModalOpen(false)}
                  className="flex-1 px-4 py-3 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={isCreatingGroup || !groupName}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingGroup ? (
                    <Spinner className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle weight="fill" className="w-5 h-5" />
                  )}
                  Grubu Oluştur
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminProtectedRoute>
  );
}
