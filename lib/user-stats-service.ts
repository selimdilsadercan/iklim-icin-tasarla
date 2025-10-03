import { supabase } from './supabase';

export interface UserBotStats {
  bot_index: number;
  bot_name: string;
  total_conversations: number;
  last_active: string;
  last_active_text: string;
}

export interface UserOverallStats {
  total_conversations: number;
  total_messages: number;
  first_chat_date: string;
  last_chat_date: string;
  most_used_bot: string;
  most_used_bot_conversations: number;
}

export interface UserBotStatsJson {
  [botName: string]: {
    total_conversations: number;
    last_active: string;
  };
}

export class UserStatsService {

  /**
   * Get bot statistics for a specific user in JSON format
   * Returns a more compact JSON object
   */
  static async getUserBotStatsJson(userId: string): Promise<UserBotStatsJson> {
    try {
      const { data, error } = await supabase.rpc('get_user_bot_stats_json', {
        user_id_param: userId
      });

      if (error) {
        console.error('Error fetching user bot stats JSON:', error);
        throw error;
      }

      return data || {};
    } catch (error) {
      console.error('Error in getUserBotStatsJson:', error);
      throw error;
    }
  }


  /**
   * Get formatted bot statistics for display
   * Returns stats in a format suitable for UI display
   */
  static async getFormattedUserBotStats(userId: string): Promise<{
    yaprak: { totalConversations: number; lastActive: string };
    robi: { totalConversations: number; lastActive: string };
    bugday: { totalConversations: number; lastActive: string };
    damla: { totalConversations: number; lastActive: string };
  }> {
    try {
      const stats = await this.getUserBotStatsJson(userId);
      
      return {
        yaprak: {
          totalConversations: stats.yaprak?.total_conversations || 0,
          lastActive: stats.yaprak?.last_active || 'Hiç aktif değil'
        },
        robi: {
          totalConversations: stats.robi?.total_conversations || 0,
          lastActive: stats.robi?.last_active || 'Hiç aktif değil'
        },
        bugday: {
          totalConversations: stats.bugday?.total_conversations || 0,
          lastActive: stats.bugday?.last_active || 'Hiç aktif değil'
        },
        damla: {
          totalConversations: stats.damla?.total_conversations || 0,
          lastActive: stats.damla?.last_active || 'Hiç aktif değil'
        }
      };
    } catch (error) {
      console.error('Error in getFormattedUserBotStats:', error);
      // Return default values on error
      return {
        yaprak: { totalConversations: 0, lastActive: 'Hiç aktif değil' },
        robi: { totalConversations: 0, lastActive: 'Hiç aktif değil' },
        bugday: { totalConversations: 0, lastActive: 'Hiç aktif değil' },
        damla: { totalConversations: 0, lastActive: 'Hiç aktif değil' }
      };
    }
  }
}
