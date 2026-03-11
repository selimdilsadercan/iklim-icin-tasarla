import { api } from "encore.dev/api";
import { supabase } from "../db/supabase";

interface CreateJobParams {
  studentIds: string[];
  startDate: string;
  endDate: string;
}

interface JobResponse {
  id: string;
  status: string;
  config: JobConfig;
  created_at: string;
  updated_at: string;
}

interface JobConfig {
  student_ids: string[];
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
            start_date: params.startDate,
            end_date: params.endDate,
          },
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
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

    if (updateError) throw updateError;
    return { job: updatedJob };
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

    if (error) throw error;
    return { success: true };
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

    if (error) throw error;
    return { success: true };
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
    // 1. İş konfigürasyonunu al
    const { data: job, error: jobError } = await supabase
      .from("batch_jobs")
      .select("config")
      .eq("id", id)
      .single();

    if (jobError) throw jobError;
    if (!job) throw new Error("İş bulunamadı");

    const { student_ids, start_date, end_date } = job.config;

    // 2. Mesajları ve öğrenci isimlerini getir
    // Not: chat_history'den mesajları, user_roles'dan isimleri çekiyoruz.
    const { data, error } = await supabase
      .from("chat_history")
      .select(`
        id,
        user_id,
        message,
        is_user,
        created_at,
        user_roles!inner(display_name)
      `)
      .in("user_id", student_ids)
      .gte("created_at", start_date)
      .lte("created_at", end_date)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const messages: JobMessage[] = (data || []).map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      message: m.message,
      is_user: m.is_user,
      created_at: m.created_at,
      display_name: m.user_roles?.display_name || "Bilinmeyen Öğrenci"
    }));

    return { messages };
  },
);

/**
 * Tüm batch işlerini listeler.
 */
export const listJobs = api(
  { expose: true, method: "GET", path: "/batch/jobs" },
  async (): Promise<ListJobsResponse> => {
    const { data, error } = await supabase
      .from("batch_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return { jobs: data || [] };
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

    if (error) throw error;
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

    if (error) throw error;
    return data;
  },
);

export interface ClassResponse {
  id: string;
  name: string;
  created_at: string;
  student_count: number;
}

export interface ListClassesResponse {
  classes: ClassResponse[];
}

export interface StudentResponse {
  user_id: string;
  email: string;
  display_name: string;
}

export interface ListStudentsResponse {
  students: StudentResponse[];
}

/**
 * Tüm sınıfları listeler (Admin kullanımı için)
 */
export const listClasses = api(
  { expose: true, method: "GET", path: "/batch/classes" },
  async (): Promise<ListClassesResponse> => {
    // Sınıfları getir
    const { data: classes, error: classesError } = await supabase
      .from("classes")
      .select("id, name, created_at")
      .eq("is_active", true);

    if (classesError) throw classesError;

    // Öğrenci sayılarını getir
    const { data: studentRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("class_id")
      .eq("role", "student");

    if (rolesError) throw rolesError;

    const classList = (classes || []).map((c) => ({
      id: c.id,
      name: c.name,
      created_at: c.created_at,
      student_count: (studentRoles || []).filter((r) => r.class_id === c.id).length,
    }));

    return { classes: classList };
  }
);

/**
 * Belirli bir sınıfın öğrencilerini listeler
 */
export const getClassStudents = api(
  { expose: true, method: "GET", path: "/batch/classes/:classId/students" },
  async ({ classId }: { classId: string }): Promise<ListStudentsResponse> => {
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, display_name")
      .eq("class_id", classId)
      .eq("role", "student");

    if (rolesError) throw rolesError;

    return { 
      students: (roles || []).map(r => ({
        user_id: r.user_id,
        email: "", 
        display_name: r.display_name
      })) 
    };
  }
);
