import { supabase } from "./supabase";
import { apiRequest } from "./api";

/**
 * Batch (Toplu) Analiz Servisi
 * Encore backend ile iletişim kurar
 */

export interface BatchJob {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  total_students: number;
  processed_students: number;
  config: {
    student_ids?: string[];
    start_date: string;
    end_date: string;
    class_id?: string;
  };
  created_at: string;
  updated_at: string;
  error_message?: string;
  fallback_count?: number;
  processed_count?: number;
  total_count?: number;
  eligible_count?: number;
  total_messages?: number;
  processed_messages?: number;
  current_student_name?: string;
  class_name?: string;
  teacher_name?: string;
  avg_overall_score?: number;
  avg_content_score?: number;
  avg_discussion_score?: number;
  participants?: { user_id: string; name: string; count: number; score?: number; fallback_count?: number }[];
}

export interface AnalysisGroup {
  id: string;
  name: string;
  description?: string;
  job_ids: string[];
  created_at: string;
}

export class BatchService {
  /**
   * Tüm batch işlerini listeler.
   */
  static async listJobs(): Promise<BatchJob[]> {
    const data = await apiRequest<{ jobs: BatchJob[] }>("/batch/jobs", "GET");
    return data.jobs || [];
  }

  /**
   * Yeni bir toplu analiz işi başlatır.
   */
  static async createJob(params: {
    classId?: string;
    studentIds?: string[];
    startDate: string;
    endDate: string;
  }): Promise<BatchJob> {
    return apiRequest<BatchJob>("/batch/jobs", "POST", params);
  }

  /**
   * Belirli bir işin detaylarını getirir (varsa).
   */
  static async getJob(id: string): Promise<BatchJob | null> {
    const data = await apiRequest<{ job: BatchJob | null }>(`/batch/jobs/${id}`, "GET");
    return data.job;
  }

  /**
   * Devam eden (bekleyen veya çalışan) ilk işi getirir.
   */
  static async getPendingJob(): Promise<BatchJob | null> {
    const data = await apiRequest<{ job: BatchJob | null }>("/batch/jobs/pending", "GET");
    return data.job;
  }

  /**
   * Bir analiz işini iptal eder veya siler.
   */
  static async deleteJob(id: string): Promise<void> {
    await apiRequest(`/batch/jobs/${id}`, "DELETE");
  }

  /**
   * Evaluator Worker durumunu kontrol eder.
   */
  static async getWorkerStatus(): Promise<{ worker_running: boolean }> {
    return apiRequest<{ worker_running: boolean }>("/batch/worker/status", "GET");
  }

  /**
   * Evaluator Worker'ı başlatır.
   */
  static async startWorker(): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>("/batch/worker/start", "POST");
  }

  /**
   * Mevcut bir işi günceller.
   */
  static async updateJob(id: string, params: {
    studentIds?: string[];
    startDate: string;
    endDate: string;
  }): Promise<BatchJob> {
    return apiRequest<BatchJob>(`/batch/jobs/${id}`, "PUT", params);
  }

  /**
   * Bir öğrencinin genel raporlarını getirir.
   */
  static async getStudentReports(studentId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc("get_student_reports", {
      p_student_id: studentId,
    });

    if (error) {
      console.error("Error fetching student reports:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Yeni bir analiz grubu oluşturur.
   */
  static async createGroup(params: { name: string; description?: string; jobIds: string[] }): Promise<AnalysisGroup> {
    return apiRequest<AnalysisGroup>("/batch/groups", "POST", params);
  }

  /**
   * Tüm analiz gruplarını listeler.
   */
  static async listGroups(): Promise<AnalysisGroup[]> {
    const data = await apiRequest<{ groups: AnalysisGroup[] }>("/batch/groups", "GET");
    return data.groups || [];
  }

  /**
   * Bir analiz grubunu siler.
   */
  static async deleteGroup(id: string): Promise<void> {
    await apiRequest(`/batch/groups/${id}`, "DELETE");
  }

  /**
   * Bir öğrencinin tüm mesaj değerlendirmelerini getirir.
   */
  static async getStudentEvaluations(studentId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc("get_student_evaluations", {
      p_student_id: studentId,
    });

    if (error) {
      console.error("Error fetching student evaluations:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Bir analiz grubunun detaylarını getirir.
   */
  static async getGroup(id: string): Promise<AnalysisGroup | null> {
    const data = await apiRequest<{ group: AnalysisGroup | null }>(`/batch/groups/${id}`, "GET");
    return data.group;
  }
}
