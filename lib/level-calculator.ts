/**
 * Level and XP calculation utilities for character progression
 */

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  progressPercentage: number;
  badge: string;
}

/**
 * Calculate level based on total conversations
 * Progressive difficulty: higher levels require more chats
 * Level 1: 0-4 chats (5 chats needed)  
 * Level 2: 5-14 chats (10 more chats needed)
 * Level 3: 15-29 chats (15 more chats needed)
 * Level 4: 30-49 chats (20 more chats needed)
 * Level 5: 50+ chats (maximum level)
 */
export function calculateLevel(totalConversations: number): LevelInfo {
  let level = 1;
  let currentXP = totalConversations;
  let xpForNextLevel = 5;
  
  // Level thresholds with progressive difficulty
  const levelThresholds = [
    { level: 1, minChats: 0, maxChats: 4, xpNeeded: 5 },
    { level: 2, minChats: 5, maxChats: 14, xpNeeded: 10 },
    { level: 3, minChats: 15, maxChats: 29, xpNeeded: 15 },
    { level: 4, minChats: 30, maxChats: 49, xpNeeded: 20 },
    { level: 5, minChats: 50, maxChats: Infinity, xpNeeded: 0 }
  ];
  
  // Find current level
  for (const threshold of levelThresholds) {
    if (totalConversations >= threshold.minChats && totalConversations <= threshold.maxChats) {
      level = threshold.level;
      currentXP = totalConversations - threshold.minChats;
      xpForNextLevel = threshold.xpNeeded;
      break;
    }
  }
  
  // Calculate progress percentage
  const progressPercentage = level === 5 ? 100 : (currentXP / xpForNextLevel) * 100;
  
  // Determine badge based on level
  const badge = getBadgeForLevel(level);
  
  return {
    level,
    currentXP,
    xpForNextLevel,
    progressPercentage,
    badge
  };
}

/**
 * Get achievement badge based on level
 */
function getBadgeForLevel(level: number): string {
  if (level >= 5) return "Master";
  if (level >= 4) return "Expert";
  if (level >= 3) return "Champion";
  if (level >= 2) return "Explorer";
  return "Beginner";
}

/**
 * Get character-specific badge titles
 */
export function getCharacterBadge(botSlug: string, level: number): string {
  const badges: Record<string, Record<number, string>> = {
    yaprak: {
      1: "Eco Starter",
      2: "Green Explorer",
      3: "Eco Champion",
      4: "Eco Expert",
      5: "Eco Hero"
    },
    robi: {
      1: "Energy Starter",
      2: "Solar Explorer",
      3: "Energy Champion",
      4: "Energy Expert",
      5: "Energy Master"
    },
    bugday: {
      1: "Farm Starter",
      2: "Crop Explorer",
      3: "Farm Champion",
      4: "Farm Expert",
      5: "Agriculture Master"
    },
    damla: {
      1: "Water Starter",
      2: "Aqua Explorer",
      3: "Water Champion",
      4: "Water Expert",
      5: "Water Guardian"
    }
  };
  
  const cappedLevel = Math.min(Math.max(level, 1), 5);
  return badges[botSlug]?.[cappedLevel] || "Eco Learner";
}
