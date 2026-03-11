import { apiRequest } from "./api";

export interface BatchJob {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  config: {
    student_ids: string[];
    start_date: string;
    end_date: string;
  };
  error_message?: string;
  created_at: string;
  updated_at: string;
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
}
