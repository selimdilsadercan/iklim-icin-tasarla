"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import AdminSidebar from "@/components/AdminSidebar";
import AdminAppBar from "@/components/AdminAppBar";
import { BatchService, BatchJob } from "@/lib/batch-service";
import {
  Trophy,
  Users,
  ChatCircle,
  ArrowLeft,  
  ArrowSquareOut,
  Clock,
  ChartBar,
  TrendUp,
  WarningCircle,
  FileText,
  User,
  LinkBreak
} from "@phosphor-icons/react";
import Link from "next/link";

interface AggregatedStudent {
  user_id: string;
  name: string;
  message_count: number;
  avg_score: number;
  fallback_count: number;
  job_count: number;
}

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlJobIds = searchParams.get("jobIds")?.split(",") || [];
  
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  
  // Filter states
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const groupId = searchParams.get("groupId");
      let idsToFetch = urlJobIds;

      if (groupId) {
        try {
          const group = await BatchService.getGroup(groupId);
          if (group) {
            idsToFetch = group.job_ids;
          }
        } catch (error) {
          console.error("Group fetch error:", error);
        }
      }

      if (idsToFetch.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const fetchedJobs = await Promise.all(
          idsToFetch.map(id => BatchService.getJob(id))
        );
        
        const validJobs = fetchedJobs.filter((j): j is BatchJob => j !== null);
        setJobs(validJobs);
        
        // Initialize filters with all options
        const teachers = Array.from(new Set(validJobs.map(j => j.teacher_name || "Sistem")));
        const classes = Array.from(new Set(validJobs.map(j => j.class_name || "Bilinmeyen")));
        setSelectedTeachers(teachers);
        setSelectedClasses(classes);

      } catch (error) {
        console.error("Report generation error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  // Unique options for filters
  const allTeachers = Array.from(new Set(jobs.map(j => j.teacher_name || "Sistem")));
  const allClasses = Array.from(new Set(jobs.map(j => j.class_name || "Bilinmeyen")));

  // Filtered jobs and aggregated data
  const { aggregatedData, groupStats } = React.useMemo(() => {
    const filteredJobs = jobs.filter(job => 
      selectedTeachers.includes(job.teacher_name || "Sistem") &&
      selectedClasses.includes(job.class_name || "Bilinmeyen")
    );

    const studentMap = new Map<string, AggregatedStudent>();
    let totalContent = 0;
    let totalDialog = 0;
    let totalOverall = 0;
    let jobCountWithStats = 0;

    filteredJobs.forEach(job => {
      if (job.avg_overall_score) {
        totalOverall += job.avg_overall_score;
        totalContent += job.avg_content_score || 0;
        totalDialog += job.avg_discussion_score || 0;
        jobCountWithStats++;
      }

      if (!job.participants) return;

      job.participants.forEach(p => {
        const existing = studentMap.get(p.user_id);
        const score = p.score || 0;
        const fCount = Number(p.fallback_count || 0);

        if (existing) {
          existing.message_count += p.count;
          existing.fallback_count += fCount;
          if (score > 0) {
            existing.avg_score = (existing.avg_score * existing.job_count + score) / (existing.job_count + 1);
            existing.job_count += 1;
          }
        } else {
          studentMap.set(p.user_id, {
            user_id: p.user_id,
            name: p.name,
            message_count: p.count,
            avg_score: score,
            fallback_count: fCount,
            job_count: score > 0 ? 1 : 0
          });
        }
      });
    });

    const sortedData = Array.from(studentMap.values()).sort((a, b) => b.message_count - a.message_count);
    
    return { 
      aggregatedData: sortedData,
      groupStats: {
        avgOverall: jobCountWithStats > 0 ? (totalOverall / jobCountWithStats).toFixed(1) : "0.0",
        avgContent: jobCountWithStats > 0 ? (totalContent / jobCountWithStats).toFixed(1) : "0.0",
        avgDialog: jobCountWithStats > 0 ? (totalDialog / jobCountWithStats).toFixed(1) : "0.0",
        totalMessages: sortedData.reduce((acc, s) => acc + s.message_count, 0)
      }
    };
  }, [jobs, selectedTeachers, selectedClasses]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Analizler Birleştiriliyor...</p>
      </div>
    );
  }

  if (!loading && jobs.length === 0) {
    return (
      <div className="text-center py-20">
        <WarningCircle size={48} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Rapor için analiz bulunamadı</h2>
        <p className="text-gray-500 mt-2">Seçilen grup veya analizler geçerli veriler içermiyor.</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 font-bold">Geri Dön</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-4 group font-medium"
          >
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span>Analiz Listesine Dön</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-2xl">
              <ChartBar size={32} weight="fill" className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">KONSOLİDE ANALİZ RAPORU</h1>
              <p className="text-gray-500 font-medium">{jobs.length} farklı analiz verisi birleştirildi</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex flex-col border-r border-gray-100 pr-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TOPLAM ÖĞRENCİ</span>
              <span className="text-xl font-black text-gray-900">{aggregatedData.length}</span>
           </div>
           <button 
             onClick={() => setShowFilters(!showFilters)}
             className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold text-sm ${showFilters ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
           >
             <ChartBar size={20} weight="bold" />
             Filtrele
           </button>
        </div>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8 animate-in slide-in-from-top-2 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User weight="fill" className="text-blue-500" /> ÖĞRETMEN FİLTRESİ
                 </h4>
                 <div className="flex flex-wrap gap-2">
                    {allTeachers.map(teacher => (
                       <button
                          key={teacher}
                          onClick={() => {
                             setSelectedTeachers(prev => 
                                prev.includes(teacher) ? prev.filter(t => t !== teacher) : [...prev, teacher]
                             );
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                             selectedTeachers.includes(teacher) 
                             ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                             : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                          }`}
                       >
                          {teacher}
                       </button>
                    ))}
                 </div>
              </div>
              <div>
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users weight="fill" className="text-purple-500" /> SINIF FİLTRESİ
                 </h4>
                 <div className="flex flex-wrap gap-2">
                    {allClasses.map(cls => (
                       <button
                          key={cls}
                          onClick={() => {
                             setSelectedClasses(prev => 
                                prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
                             );
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                             selectedClasses.includes(cls) 
                             ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm' 
                             : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                          }`}
                       >
                          {cls}
                       </button>
                    ))}
                 </div>
              </div>
           </div>
           <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end">
              <button 
                onClick={() => {
                   setSelectedTeachers(allTeachers);
                   setSelectedClasses(allClasses);
                }}
                className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"
              >
                Filtreleri Sıfırla
              </button>
           </div>
        </div>
      )}

      {/* Group Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-blue-100 group">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 text-center group-hover:text-blue-500">GRUP ORTALAMASI</span>
            <div className="text-2xl font-black text-gray-900 text-center">{groupStats.avgOverall} <span className="text-xs text-gray-400">/ 10</span></div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-blue-100 group">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 text-center text-blue-500">İÇERİK ORTALAMASI</span>
            <div className="text-2xl font-black text-blue-600 text-center">{groupStats.avgContent}</div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-purple-100 group">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 text-center text-purple-500">DİYALOG ORTALAMASI</span>
            <div className="text-2xl font-black text-purple-600 text-center">{groupStats.avgDialog}</div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-orange-100 group">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 text-center text-orange-500">TOPLAM MESAJ</span>
            <div className="text-2xl font-black text-orange-600 text-center">{groupStats.totalMessages}</div>
         </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={20} weight="fill" className="text-blue-500" />
            <h2 className="text-lg font-black text-gray-800">ÖĞRENCİ PERFORMANS SIRALAMASI</h2>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MESAJ SAYISINA GÖRE SIRALANMIŞTIR</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">
                <th className="px-8 py-5 w-20 text-center">DR</th>
                <th className="px-6 py-5">ÖĞRENCİ ADI</th>
                <th className="px-6 py-5 text-center">MESAJ</th>
                <th className="px-6 py-5 text-center">SKOR</th>
                <th className="px-6 py-5 text-right pr-8">EYLEM</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedData.map((student, index) => (
                <tr key={student.user_id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0 text-gray-700">
                  <td className="px-8 py-5 text-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto text-xs font-black ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-50' :
                      index === 1 ? 'bg-gray-100 text-gray-600 ring-2 ring-gray-50' :
                      index === 2 ? 'bg-orange-50 text-orange-700 ring-2 ring-orange-50' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{student.name.toLocaleUpperCase("tr-TR")}</span>
                      {student.fallback_count > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <WarningCircle size={12} weight="fill" className="text-red-400" />
                          <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">Analiz yedek sistemle yapıldı</span>
                        </div>
                      )}
                      {student.job_count === 0 && (
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1 italic">Henüz analiz edilmedi</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-black text-gray-900">{student.message_count}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {student.job_count > 0 ? (
                      <div className={`inline-flex items-center justify-center px-4 py-1.5 rounded-xl text-sm font-black ring-1 ring-inset ${
                        student.avg_score >= 4 ? 'bg-green-50 text-green-700 ring-green-100' :
                        student.avg_score >= 3 ? 'bg-yellow-50 text-yellow-700 ring-yellow-100' :
                        'bg-red-50 text-red-700 ring-red-100'
                      }`}>
                        {student.avg_score.toFixed(1)}
                      </div>
                    ) : (
                      <span className="text-gray-300 font-bold">--</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right pr-8">
                     <Link 
                       href={`/admin/student?studentId=${student.user_id}`}
                       className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all uppercase tracking-widest group/btn"
                     >
                       PROFİLİ AÇ
                       <ArrowSquareOut size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                     </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {aggregatedData.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
              <Users size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium italic">Seçilen analizlerde öğrenci verisi bulunamadı.</p>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
               <Trophy size={24} weight="fill" className="text-blue-600" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">EN YÜKSEK SKOR (GRUP)</p>
               <p className="text-xl font-black text-gray-900">
                  {aggregatedData.length > 0 ? Math.max(...aggregatedData.map(s => s.avg_score)).toFixed(1) : "--"}
               </p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
               <ChatCircle size={24} weight="fill" className="text-green-600" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">TOPLAM ETKİLEŞİM</p>
               <p className="text-xl font-black text-gray-900">
                  {groupStats.totalMessages}
               </p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
               <TrendUp size={24} weight="fill" className="text-amber-600" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">GENEL PERFORMANS</p>
               <p className="text-xl font-black text-gray-900">
                  {groupStats.avgOverall}
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <AdminProtectedRoute>
      <div className="min-h-screen w-full bg-[#f8fafc] text-gray-800">
        <AdminAppBar currentPage="batch" />
        <AdminSidebar currentPage="batch" />

        <div className="lg:ml-64 px-6 pb-24 lg:pb-8 pt-8 min-h-screen" lang="tr">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <ReportContent />
          </Suspense>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
