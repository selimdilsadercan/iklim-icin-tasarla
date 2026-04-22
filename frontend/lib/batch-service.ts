import { apiRequest } from "./api";

export interface BatchJob {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  config: {
    student_ids: string[];
    start_date: string;
    end_date: string;
    class_id: string;
  };
  error_message?: string;
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
  participants?: { user_id: string; name: string; count: number; score?: number; fallback_count?: number }[];
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
   * Yeni bir batch işi oluşturur.
   */
  static async createJob(params: {
    studentIds: string[];
    classId: string;
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
   * Pending durumdaki bir işi siler.
   */
  static async deleteJob(id: string): Promise<void> {
    await apiRequest(`/batch/jobs/${id}`, "DELETE");
  }

  /**
   * Pending durumdaki bir işin config'ini günceller.
   */
  static async updateJob(id: string, params: {
    studentIds?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<BatchJob> {
    return apiRequest<BatchJob>(`/batch/jobs/${id}`, "PATCH", params);
  }

  /**
   * Worker'ı başlatır.
   */
  static async startWorker(): Promise<{ status: string }> {
    return apiRequest<{ status: string }>("/batch/worker/start", "POST");
  }

  /**
   * Worker durumunu sorgular.
   */
  static async getWorkerStatus(): Promise<{ worker_running: boolean }> {
    return apiRequest<{ worker_running: boolean }>("/batch/worker/status", "GET");
  }

  /**
   * Bir öğrencinin mesaj değerlendirmelerini getirir.
   */
  static async getStudentEvaluations(studentId: string): Promise<any[]> {
    const data = await apiRequest<{ evaluations: any[] }>(`/batch/evaluations/student/${studentId}`, "GET");
    return data.evaluations || [];
  }

  /**
   * Bir öğrencinin genel raporlarını getirir.
   */
  static async getStudentReports(studentId: string): Promise<any[]> {
    const data = await apiRequest<{ reports: any[] }>(`/batch/reports/student/${studentId}`, "GET");
    return data.reports || [];
  }
} 
