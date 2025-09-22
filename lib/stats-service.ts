import { supabase } from './supabase';

export interface BotStats {
  totalConversations: number;
  lastActive: string;
  dailyUsers: number;
  avgSessionTime: string;
}

export interface AllBotStats {
  yaprak: BotStats;
  robi: BotStats;
  bugday: BotStats;
  damla: BotStats;
}

// Helper function to format time ago in Turkish
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return "Şimdi";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} dakika önce`;
  } else if (diffInMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} saat önce`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} gün önce`;
  }
};

// Helper function to calculate average session time
const calculateAvgSessionTime = (messages: any[]): string => {
  if (messages.length === 0) return "0 dk";
  
  // Group messages by user sessions (messages within 30 minutes are considered same session)
  const sessions = new Map<string, Date[]>();
  
  messages.forEach(msg => {
    const userId = msg.user_id;
    const msgTime = new Date(msg.created_at);
    
    if (!sessions.has(userId)) {
      sessions.set(userId, []);
    }
    
    const userSessions = sessions.get(userId)!;
    const lastSession = userSessions[userSessions.length - 1];
    
    // If this message is within 30 minutes of the last message, it's the same session
    if (!lastSession || (msgTime.getTime() - lastSession.getTime()) > 30 * 60 * 1000) {
      userSessions.push(msgTime);
    }
  });
  
  // Calculate average session duration
  let totalDuration = 0;
  let sessionCount = 0;
  
  sessions.forEach(sessionTimes => {
    if (sessionTimes.length > 1) {
      const sessionDuration = sessionTimes[sessionTimes.length - 1].getTime() - sessionTimes[0].getTime();
      totalDuration += sessionDuration;
      sessionCount++;
    }
  });
  
  if (sessionCount === 0) return "0 dk";
  
  const avgDurationMinutes = Math.round(totalDuration / sessionCount / (1000 * 60));
  return `${avgDurationMinutes} dk`;
};

// Helper function to count daily active users
const countDailyUsers = (messages: any[]): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dailyUsers = new Set<string>();
  
  messages.forEach(msg => {
    const msgDate = new Date(msg.created_at);
    if (msgDate >= today) {
      dailyUsers.add(msg.user_id);
    }
  });
  
  return dailyUsers.size;
};

// Helper function to get last active time
const getLastActive = (messages: any[]): string => {
  if (messages.length === 0) return "Hiç aktif değil";
  
  const lastMessage = messages.reduce((latest, current) => {
    return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
  });
  
  return formatTimeAgo(new Date(lastMessage.created_at));
};

export class StatsService {
  static async getBotStats(): Promise<AllBotStats> {
    try {
      // Get message counts for all bots
      const { data: messageCounts, error: countsError } = await supabase.rpc('get_bot_message_counts');
      
      if (countsError) {
        console.error('Error fetching bot message counts:', countsError);
        return this.getDefaultStats();
      }

      // Get detailed message data for each bot to calculate more accurate stats
      const botIndices = [0, 1, 2, 3]; // yaprak, robi, bugday, damla
      const botSlugs = ['yaprak', 'robi', 'bugday', 'damla'] as const;
      
      const stats: AllBotStats = {
        yaprak: { totalConversations: 0, lastActive: "Hiç aktif değil", dailyUsers: 0, avgSessionTime: "0 dk" },
        robi: { totalConversations: 0, lastActive: "Hiç aktif değil", dailyUsers: 0, avgSessionTime: "0 dk" },
        bugday: { totalConversations: 0, lastActive: "Hiç aktif değil", dailyUsers: 0, avgSessionTime: "0 dk" },
        damla: { totalConversations: 0, lastActive: "Hiç aktif değil", dailyUsers: 0, avgSessionTime: "0 dk" }
      };

      // Fetch detailed data for each bot
      for (let i = 0; i < botIndices.length; i++) {
        const botIndex = botIndices[i];
        const botSlug = botSlugs[i];
        
        try {
          // Get all messages for this bot
          const { data: messages, error: messagesError } = await supabase
            .from('chat_history')
            .select('*')
            .eq('bot_index', botIndex)
            .order('created_at', { ascending: false });

          if (messagesError) {
            console.error(`Error fetching messages for bot ${botSlug}:`, messagesError);
            continue;
          }

          if (messages && messages.length > 0) {
            // Count conversations (pairs of user-bot messages)
            const userMessages = messages.filter(msg => msg.is_user);
            const totalConversations = userMessages.length;
            
            // Calculate other stats
            const lastActive = getLastActive(messages);
            const dailyUsers = countDailyUsers(messages);
            const avgSessionTime = calculateAvgSessionTime(messages);

            stats[botSlug] = {
              totalConversations,
              lastActive,
              dailyUsers,
              avgSessionTime
            };
          }
        } catch (error) {
          console.error(`Error processing stats for bot ${botSlug}:`, error);
        }
      }

      return stats;
    } catch (error) {
      console.error('Error fetching bot stats:', error);
      return this.getDefaultStats();
    }
  }

  private static getDefaultStats(): AllBotStats {
    return {
      yaprak: {
        totalConversations: 0,
        lastActive: "Hiç aktif değil",
        dailyUsers: 0,
        avgSessionTime: "0 dk"
      },
      robi: {
        totalConversations: 0,
        lastActive: "Hiç aktif değil",
        dailyUsers: 0,
        avgSessionTime: "0 dk"
      },
      bugday: {
        totalConversations: 0,
        lastActive: "Hiç aktif değil",
        dailyUsers: 0,
        avgSessionTime: "0 dk"
      },
      damla: {
        totalConversations: 0,
        lastActive: "Hiç aktif değil",
        dailyUsers: 0,
        avgSessionTime: "0 dk"
      }
    };
  }
}
