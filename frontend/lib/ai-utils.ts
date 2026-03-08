import { AIService, BOT_PERSONAS } from './ai-service'
import { BotSlug } from './chat-utils'

/**
 * Utility functions for AI integration
 */

// Test AI connection
export async function testAIConnection(): Promise<boolean> {
  try {
    // First, try to get available models
    const models = await AIService.getAvailableModels()
    console.log('Available models:', models)
    
    // Try to get a simple response from any bot
    const testResponse = await AIService.chat('yaprak' as BotSlug, 'Merhaba, test mesajı')
    return testResponse.length > 0
  } catch (error) {
    console.error('AI connection test failed:', error)
    return false
  }
}

// Get available models
export async function getAvailableModels(): Promise<string[]> {
  try {
    return await AIService.getAvailableModels()
  } catch (error) {
    console.error('Failed to get available models:', error)
    return []
  }
}

// Get all available bot personas
export function getAvailableBots(): Array<{ slug: BotSlug; persona: typeof BOT_PERSONAS[BotSlug] }> {
  return Object.entries(BOT_PERSONAS).map(([slug, persona]) => ({
    slug: slug as BotSlug,
    persona
  }))
}

// Initialize all bot chats
export function initializeAllBots(historyLimit = 64) {
  Object.keys(BOT_PERSONAS).forEach(botSlug => {
    try {
      AIService.initChat(botSlug as BotSlug, historyLimit)
    } catch (error) {
      console.error(`Failed to initialize bot ${botSlug}:`, error)
    }
  })
}

// Clear all bot chat histories
export function clearAllBotHistories() {
  Object.keys(BOT_PERSONAS).forEach(botSlug => {
    try {
      AIService.clearChatHistory(botSlug as BotSlug)
    } catch (error) {
      console.error(`Failed to clear history for bot ${botSlug}:`, error)
    }
  })
}
