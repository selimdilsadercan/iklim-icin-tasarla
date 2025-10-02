import { AIService } from './ai-service'
import { BotSlug } from './chat-utils'

export interface BetaMessage {
  id: string
  text: string
  isBot: boolean
  timestamp: Date
}

export class BetaChatService {
  // Initialize AI chat for a bot (no database storage)
  static initChat(botSlug: BotSlug, historyLimit = 64) {
    try {
      AIService.initChat(botSlug, historyLimit)
    } catch (error) {
      console.error('Error initializing beta AI chat:', error)
    }
  }

  // Get AI response without saving to database
  static async getBotResponse(
    botSlug: BotSlug, 
    userMessage: string
  ): Promise<string> {
    try {
      return await AIService.chat(botSlug, userMessage)
    } catch (error) {
      console.error('Error getting beta AI response:', error)
      return "Üzgünüm, şu anda bir hata oluştu. Lütfen tekrar deneyin."
    }
  }

  // Get AI response with streaming (no database storage)
  static async getBotResponseStream(
    botSlug: BotSlug, 
    userMessage: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      return await AIService.chatStream(botSlug, userMessage, onChunk)
    } catch (error) {
      console.error('Error getting beta AI response stream:', error)
      return "Üzgünüm, şu anda bir hata oluştu. Lütfen tekrar deneyin."
    }
  }

  // Clear AI chat history for a bot
  static clearChatHistory(botSlug: BotSlug) {
    try {
      AIService.clearChatHistory(botSlug)
    } catch (error) {
      console.error('Error clearing beta AI chat history:', error)
    }
  }

  // Get welcome message for a bot
  static getWelcomeMessage(botSlug: BotSlug): string {
    const welcomeMessages = {
      yaprak: "Merhaba! Ben Yaprak, bitki ve doğa konularında sana yardımcı olabilirim. Hangi konuda merak ettiğin bir şey var?",
      robi: "Selam! Ben Robi, teknoloji ve robotik konularında uzmanım. Ne öğrenmek istiyorsun?",
      bugday: "Merhaba! Ben Buğday, tarım ve gıda konularında sana rehberlik edebilirim. Hangi konuda soruların var?",
      damla: "Selam! Ben Damla, su ve çevre konularında sana yardımcı olabilirim. Ne öğrenmek istiyorsun?"
    }
    
    return welcomeMessages[botSlug] || "Merhaba! Size nasıl yardımcı olabilirim?"
  }
}
