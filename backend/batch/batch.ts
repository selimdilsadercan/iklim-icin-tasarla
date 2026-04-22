import { api, APIError, ErrCode } from "encore.dev/api";
import { supabase } from "../db/supabase";

interface CreateJobParams {
  studentIds: string[];
  classId: string;
  startDate: string;
  endDate: string;
}

interface JobResponse {
  id: string;
  status: string;
  config: JobConfig;
  created_at: string;
  updated_at: string;
  processed_count: number;
  total_count: number;
  eligible_count: number;
  total_messages: number;
  processed_messages: number;
  current_student_name?: string;
  class_name: string;
  teacher_name: string;
  avg_overall_score?: number;
  avg_content_score?: number;
  avg_discussion_score?: number;
  fallback_count?: number;
  participants?: { user_id: string; name: string; count: number; score?: number }[];
}

interface JobConfig {
  student_ids: string[];
  class_id?: string;
  start_date: string;
  end_date: string;
}

interface ListJobsResponse {
  jobs: JobResponse[];
}

interface GetPendingJobResponse {
  job: JobResponse | null;
}

/**
 * Yeni bir toplu değerlendirme işi (Batch Job) oluşturur.
 */
export const createJob = api(
  { expose: true, method: "POST", path: "/batch/jobs" },
  async (params: CreateJobParams): Promise<JobResponse> => {
    const { data, error } = await supabase
      .from("batch_jobs")
      .insert([
        {
          status: "pending",
          config: {
            student_ids: params.studentIds,
            class_id: params.classId,
            start_date: params.startDate,
            end_date: params.endDate,
          },
        },
      ])
      .select()
      .single();

    if (error) {
      throw new APIError(ErrCode.Internal, error.message);
    }
    return {
      ...data,
      processed_count: 0,
      total_count: params.studentIds.length,
      eligible_count: 0,
      total_messages: 0,
      processed_messages: 0,
    };
  },
);

/**
 * Evaluator (Python) için bekleyen bir işi getirir ve "running" durumuna çeker (Atomik Claim).
 */
export const claimPendingJob = api(
  { expose: true, method: "POST", path: "/batch/jobs/claim" },
  async (): Promise<GetPendingJobResponse> => {
    // 1. Bekleyen en eski işi bul
    const { data: job, error: fetchError } = await supabase
      .from("batch_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!job) return { job: null };

    // 2. İşin durumunu "running" olarak güncelle
    const { data: updatedJob, error: updateError } = await supabase
      .from("batch_jobs")
      .update({ 
        status: "running",
        updated_at: new Date().toISOString() 
      })
      .eq("id", job.id)
      .select()
      .single();

    if (updateError) {
      throw new APIError(ErrCode.Internal, updateError.message);
    }

    // processed_count ve total_count hesapla
    const { count } = await supabase
      .from("student_reports")
      .select("*", { count: "exact", head: true })
      .eq("job_id", job.id);

    return { 
      job: {
        ...updatedJob,
        processed_count: count || 0,
        total_count: updatedJob.config.student_ids?.length || 0,
        eligible_count: 0,
        total_messages: 0,
        processed_messages: 0
      } 
    };
  },
);

interface UpdateStatusParams {
  id: string; // Path parameter from /batch/jobs/:id/status
  status: "pending" | "running" | "completed" | "failed";
  errorMessage?: string;
}

/**
 * İşin durumunu günceller.
 */
export const updateJobStatus = api(
  { expose: true, method: "PATCH", path: "/batch/jobs/:id/status" },
  async (params: UpdateStatusParams): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .from("batch_jobs")
      .update({
        status: params.status,
        error_message: params.errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (error) {
      throw new APIError(ErrCode.Internal, error.message);
    }
    return { success: true };
  },
);

// ─── Öğrenci Raporu ───────────────────────────────────────────────

interface StudentReportParams {
  jobId: string;
  studentId: string;
  studentName: string;
  overallScore: number;
  stats: any;
  llmEvaluation: any;
}

interface StudentReportResponse {
  id: string;
  job_id: string;
  student_id: string;
  student_name: string;
  overall_score: number;
  stats: any;
  llm_evaluation: any;
  created_at: string;
}

/**
 * Öğrenci analiz raporunu kaydeder.
 */
export const submitStudentReport = api(
  { expose: true, method: "POST", path: "/batch/student-report" },
  async (params: StudentReportParams): Promise<{ success: boolean; id: string }> => {
    const { data, error } = await supabase
      .from("student_reports")
      .insert([
        {
          job_id: params.jobId,
          student_id: params.studentId,
          student_name: params.studentName,
          overall_score: params.overallScore,
          stats: params.stats,
          llm_evaluation: params.llmEvaluation,
        },
      ])
      .select("id")
      .single();

    if (error) {
      throw new APIError(ErrCode.Internal, error.message);
    }
    return { success: true, id: data.id };
  },
);

/**
 * Bir batch işine ait tüm öğrenci raporlarını getirir.
 */
export const getJobReports = api(
  { expose: true, method: "GET", path: "/batch/jobs/:id/reports" },
  async ({ id }: { id: string }): Promise<{ reports: StudentReportResponse[] }> => {
    const { data, error } = await supabase
      .from("student_reports")
      .select("*")
      .eq("job_id", id)
      .order("student_name", { ascending: true });

    if (error) {
      throw new APIError(ErrCode.Internal, error.message);
    }
    return { reports: data || [] };
  },
);

interface EvaluationResult {
  messageId: string;
  jobId: string;
  scores: any;
  feedback?: string;
}

/**
 * Değerlendirme sonucunu sisteme kaydeder.
 */
export const submitEvaluation = api(
  { expose: true, method: "POST", path: "/batch/evaluate" },
  async (params: EvaluationResult): Promise<{ success: boolean }> => {
    const { error } = await supabase.from("message_evaluations").insert([
      {
        message_id: params.messageId,
        job_id: params.jobId,
        scores: params.scores,
        feedback: params.feedback,
      },
    ]);

    if (error) {
      throw new APIError(ErrCode.Internal, error.message);
    }
    return { success: true };
  },
);

/**
 * Bir öğrencinin tüm mesaj değerlendirmelerini getirir (RPC).
 */
export const getStudentEvaluations = api(
  { expose: true, method: "GET", path: "/batch/evaluations/student/:studentId" },
  async ({ studentId }: { studentId: string }): Promise<{ evaluations: any[] }> => {
    try {
      const { data, error } = await supabase.rpc("get_student_evaluations", {
        p_student_id: studentId,
      });

      if (error) {
        throw new APIError(ErrCode.Internal, `Database error: ${error.message}`);
      }

      return { evaluations: data || [] };
    } catch (e: any) {
      if (e instanceof APIError) throw e;
      throw new APIError(ErrCode.Internal, e.message || "Bilinmeyen bir hata oluştu");
    }
  },
);

/**
 * Bir öğrencinin tüm raporlarını getirir (RPC).
 */
export const getStudentReports = api(
  { expose: true, method: "GET", path: "/batch/reports/student/:studentId" },
  async ({ studentId }: { studentId: string }): Promise<{ reports: any[] }> => {
    try {
      const { data, error } = await supabase.rpc("get_student_reports", {
        p_student_id: studentId,
      });

      if (error) {
        throw new APIError(ErrCode.Internal, `Database error: ${error.message}`);
      }

      return { reports: data || [] };
    } catch (e: any) {
      if (e instanceof APIError) throw e;
      throw new APIError(ErrCode.Internal, e.message || "Bilinmeyen bir hata oluştu");
    }
  },
);


interface JobMessagesResponse {
  messages: JobMessage[];
}

interface JobMessage {
  id: string;
  user_id: string;
  message: string;
  is_user: boolean;
  created_at: string;
  display_name: string | null;
}

/**
 * Belirli bir iş kapsamındaki tüm öğrenci mesajlarını getirir.
 */
export const getJobMessages = api(
  { expose: true, method: "GET", path: "/batch/jobs/:id/messages" },
  async ({ id }: { id: string }): Promise<JobMessagesResponse> => {
    try {
      // Supabase RPC fonksiyonunu çağırıyoruz
      const { data, error } = await supabase.rpc("get_job_messages", {
        p_job_id: id,
      });

      if (error) {
        throw new APIError(
          ErrCode.Internal,
          `Database error: ${error.message}`
        );
      }

      const messages: JobMessage[] = (data || []).map((m: any) => ({
        id: m.msg_id,
        user_id: m.student_id,
        message: m.message,
        is_user: m.is_user,
        created_at: m.created_at,
        display_name: m.display_name || "Bilinmeyen Öğrenci",
      }));

      return { messages };
    } catch (e: any) {
      if (e instanceof APIError) throw e;
      throw new APIError(ErrCode.Internal, e.message || "Bilinmeyen bir hata oluştu");
    }
  },
);

/**
 * Tüm batch işlerini listeler (RPC ile detaylı istatistiklerle).
 */
export const listJobs = api(
  { expose: true, method: "GET", path: "/batch/jobs" },
  async (): Promise<ListJobsResponse> => {
    // Yeni RPC fonksiyonunu çağırıyoruz
    const { data, error } = await supabase.rpc("get_jobs_with_stats", {
      p_limit: 100
    });

    if (error) {
      throw new APIError(ErrCode.Internal, error.message);
    }

    const jobs: JobResponse[] = (data || []).map((j: any) => ({
      id: j.id,
      status: j.status,
      config: j.config,
      error_message: j.error_message,
      created_at: j.created_at,
      updated_at: j.updated_at,
      processed_count: Number(j.processed_count || 0),
      total_count: Number(j.total_count || 0),
      eligible_count: Number(j.eligible_count || 0),
      total_messages: Number(j.total_messages || 0),
      processed_messages: Number(j.processed_messages || 0),
      current_student_name: j.current_student_name,
      class_name: j.class_name,
      teacher_name: j.teacher_name,
      avg_overall_score: j.avg_overall_score ? Number(j.avg_overall_score) : undefined,
      avg_content_score: j.avg_content_score ? Number(j.avg_content_score) : undefined,
      avg_discussion_score: j.avg_discussion_score ? Number(j.avg_discussion_score) : undefined,
      fallback_count: j.fallback_count ? Number(j.fallback_count) : 0,
      participants: j.participants
    }));

    return { jobs };
  },
);


interface DeleteJobParams {
  id: string;
}

/**
 * Pending durumdaki bir işi siler.
 */
export const deleteJob = api(
  { expose: true, method: "DELETE", path: "/batch/jobs/:id" },
  async (params: DeleteJobParams): Promise<{ success: boolean }> => {
    // Önce işin pending olduğunu kontrol et
    const { data: job, error: fetchError } = await supabase
      .from("batch_jobs")
      .select("status")
      .eq("id", params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!job) throw new Error("İş bulunamadı");
    if (job.status !== "pending") {
      throw new Error("Sadece bekleyen (pending) işler silinebilir");
    }

    const { error } = await supabase
      .from("batch_jobs")
      .delete()
      .eq("id", params.id);

    if (error) {
      throw new APIError(ErrCode.Internal, error.message);
    }
    return { success: true };
  },
);

interface UpdateJobParams {
  id: string;
  studentIds?: string[];
  startDate?: string;
  endDate?: string;
}

const EVALUATOR_URL = "https://chamois-rich-grossly.ngrok-free.app";

/**
 * Python Evaluator Worker'ını başlatır.
 */
export const startWorker = api(
  { expose: true, method: "POST", path: "/batch/worker/start" },
  async (): Promise<{ status: string }> => {
    try {
      const response = await fetch(`${EVALUATOR_URL}/worker/start`, {
        method: "POST"
      });
      return (await response.json()) as { status: string };
    } catch (e) {
      throw new Error("Evaluator servisine erişilemedi. Lütfen servisin çalıştığından emin olun.");
    }
  },
);

/**
 * Python Evaluator Worker durumunu sorgular.
 */
export const getWorkerStatus = api(
  { expose: true, method: "GET", path: "/batch/worker/status" },
  async (): Promise<{ worker_running: boolean }> => {
    try {
      const response = await fetch(`${EVALUATOR_URL}/`);
      const data = (await response.json()) as { worker_running: boolean };
      return { worker_running: data.worker_running };
    } catch (e) {
       return { worker_running: false };
    }
  },
);

/**
 * Pending durumdaki bir işin konfigürasyonunu günceller.
 */
export const updateJob = api(
  { expose: true, method: "PATCH", path: "/batch/jobs/:id" },
  async (params: UpdateJobParams): Promise<JobResponse> => {
    // Önce işin pending olduğunu kontrol et
    const { data: job, error: fetchError } = await supabase
      .from("batch_jobs")
      .select("*")
      .eq("id", params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!job) throw new Error("İş bulunamadı");
    if (job.status !== "pending") {
      throw new Error("Sadece bekleyen (pending) işler düzenlenebilir");
    }

    const newConfig = {
      student_ids: params.studentIds || job.config.student_ids,
      start_date: params.startDate || job.config.start_date,
      end_date: params.endDate || job.config.end_date,
    };

    const { data, error } = await supabase
      .from("batch_jobs")
      .update({
        config: newConfig,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      throw new APIError(ErrCode.Internal, error.message);
    }
    return data;
  },
);


