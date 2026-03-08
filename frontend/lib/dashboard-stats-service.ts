import { supabase } from "./supabase";

export interface DashboardStats {
  total_classes: number;
  total_students: number;
  total_conversations: number;
}

export interface BotDistribution {
  bot_index: number;
  bot_name: string;
  conversation_count: number;
  percentage: number;
  [key: string]: string | number;
}

export interface MessageTrend {
  date: string;
  message_count: number;
}

export class DashboardStatsService {
  /**
   * Get dashboard statistics for a teacher/admin
   * Returns total classes, total students, and total conversations
   */
  static async getDashboardStats(
    teacherUid: string
  ): Promise<DashboardStats | null> {
    const { data, error } = await supabase.rpc("get_dashboard_stats", {
      teacher_uid: teacherUid,
    });

    if (error) {
      console.error("Error fetching dashboard stats:", error);
      throw new Error("Failed to fetch dashboard statistics");
    }

    return data?.[0] || null;
  }

  /**
   * Get bot distribution for a teacher/admin
   * Returns conversation counts and percentages for each bot
   */
  static async getBotDistribution(
    teacherUid: string
  ): Promise<BotDistribution[]> {
    const { data, error } = await supabase.rpc("get_bot_distribution", {
      teacher_uid: teacherUid,
    });

    if (error) {
      console.error("Error fetching bot distribution:", error);
      throw new Error("Failed to fetch bot distribution");
    }

    return data || [];
  }

  /**
   * Get message trend for a teacher/admin
   * Returns daily message counts for the last N days (default 30)
   */
  static async getMessageTrend(
    teacherUid: string,
    daysBack: number = 30
  ): Promise<MessageTrend[]> {
    const { data, error } = await supabase.rpc("get_message_trend", {
      teacher_uid: teacherUid,
      days_back: daysBack,
    });

    if (error) {
      console.error("Error fetching message trend:", error);
      throw new Error("Failed to fetch message trend");
    }

    return data || [];
  }
}
