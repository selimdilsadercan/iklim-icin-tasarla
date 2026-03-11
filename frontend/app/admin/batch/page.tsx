"use client";

import { useState, useEffect } from "react";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import AdminSidebar from "@/components/AdminSidebar";
import AdminAppBar from "@/components/AdminAppBar";
import { BatchService, BatchJob } from "@/lib/batch-service";
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
} from "@phosphor-icons/react";

export default function BatchAdminPage() {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Edit modal local states
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // İşleri çekme
  const fetchJobs = async () => {
    try {
      const data = await BatchService.listJobs();
      setJobs(data);
    } catch (error) {
      console.error("Jobs fetch error:", error);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchJobs();
    fetchClasses();
    const interval = setInterval(fetchJobs, 5000);
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

        <div className="lg:ml-64 px-6 pb-24 lg:pb-8 pt-8 min-h-screen">
          <div className="max-w-sm lg:max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Batch Değerlendirme Sistemi
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Öğrenci mesajlarını toplu olarak rubric kriterlerine göre akıllı asistan ile analiz edin.
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
                    <h3 className="text-sm font-medium text-gray-600">Bekleyen/Çalışan</h3>
                    <div className="text-2xl font-bold text-gray-900">
                      {jobs.filter(j => j.status === "pending" || j.status === "running").length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle weight="fill" className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-600">Tamamlanan</h3>
                    <div className="text-2xl font-bold text-gray-900">
                      {jobs.filter(j => j.status === "completed").length}
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
                    <h3 className="text-sm font-medium text-gray-600">Kayıtlı Sınıf</h3>
                    <div className="text-2xl font-bold text-gray-900">
                      {classes.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex justify-end mb-8">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
              >
                <Plus weight="bold" className="w-5 h-5" />
                Yeni Analiz Başlat
              </button>
            </div>

            {/* Jobs Table Wrapper */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-100 bg-white/50">
                <h3 className="text-lg font-bold text-gray-800">Son Analiz İşleri</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                      <th className="px-6 py-4 font-semibold text-gray-900">İş ID</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Durum</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Kapsam</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Tarih Aralığı</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Oluşturulma</th>
                      <th className="px-6 py-4 font-semibold text-gray-900 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
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
                      jobs.map((job) => (
                        <tr
                          key={job.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono text-sm text-gray-600">
                            #{job.id.slice(0, 8)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(job.status)}
                              <span
                                className={`text-sm font-medium capitalize 
                                ${
                                  job.status === "completed"
                                    ? "text-green-600"
                                    : job.status === "running"
                                      ? "text-blue-600"
                                      : job.status === "failed"
                                        ? "text-red-600"
                                        : "text-gray-500"
                                }`}
                              >
                                {job.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {job.config.student_ids?.length || 0} Öğrenci
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {job.config.start_date} / {job.config.end_date}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(job.created_at).toLocaleString("tr-TR")}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {job.status === "pending" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditModal(job)}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Düzenle"
                                >
                                  <PencilSimple weight="bold" className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteJob(job.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Sil"
                                >
                                  <Trash weight="bold" className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))
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
                  <Play weight="fill" className="w-5 h-5 flex-shrink-0 mt-0.5" />
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
                  onClick={() => { setIsEditModalOpen(false); setEditingJob(null); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle weight="bold" className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Job ID info */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-1">İş ID</p>
                  <p className="font-mono text-sm text-gray-700">#{editingJob.id.slice(0, 8)}</p>
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
                  onClick={() => { setIsEditModalOpen(false); setEditingJob(null); }}
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
      </div>
    </AdminProtectedRoute>
  );
}
