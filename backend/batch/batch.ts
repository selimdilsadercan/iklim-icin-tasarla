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
  config: any;
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
  async (): Promise<JobResponse | null> => {
    const { data, error } = await supabase
      .from("batch_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
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
