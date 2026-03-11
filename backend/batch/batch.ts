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
 * Evaluator (Python) için bekleyen bir işi getirir.
 */
export const getPendingJob = api(
  { expose: true, method: "GET", path: "/batch/jobs/pending" },
  async (): Promise<GetPendingJobResponse> => {
    const { data, error } = await supabase
      .from("batch_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return { job: data };
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
