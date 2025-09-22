import { supabase } from './supabase'
import { ChatMessage, getBotIndex, getBotWelcomeMessage, BotSlug } from './chat-utils'
import { AIService, BOT_PERSONAS } from './ai-service'
import { Database } from './supabase-types'

type ChatHistoryRow = Database['public']['Tables']['chat_history']['Row']
type GetChatHistoryResult = Database['public']['Functions']['get_chat_history']['Returns'][0]
type SaveChatMessageResult = Database['public']['Functions']['save_chat_message']['Returns']

export class ChatService {
  // Load chat history for a specific bot using RPC (gets user_id from auth automatically)
  static async loadChatHistory(botSlug: string): Promise<ChatMessage[]> {
    try {
      const botIndex = getBotIndex(botSlug)
      
      const { data, error } = await supabase.rpc('get_chat_history', {
        bot_idx: botIndex
      })

      if (error) {
        console.error('Error loading chat history:', error)
        return []
      }

      return (data as GetChatHistoryResult[]) || []
    } catch (error) {
      console.error('Error loading chat history:', error)
      return []
    }
  }

  // Save a message to chat history using RPC
  static async saveMessage(
    botSlug: string, 
    userId: string, 
    message: string, 
    isUser: boolean
  ): Promise<ChatMessage | null> {
    try {
      const botIndex = getBotIndex(botSlug)
      
      const { data, error } = await supabase.rpc('save_chat_message', {
        bot_idx: botIndex,
        is_user_message: isUser,
        message_text: message
      })

      if (error) {
        console.error('Error saving message:', error)
        return null
      }

      // The RPC returns a string (message ID), we need to construct a ChatMessage object
      // Since we don't have the full message data from the RPC, we'll create a minimal object
      // In a real scenario, you might want to fetch the message after saving
      const messageId = data as SaveChatMessageResult
      
      return {
        id: messageId,
        bot_index: botIndex,
        user_id: userId,
        message: message,
        is_user: isUser,
        created_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error saving message:', error)
      return null
    }
  }

  // Get AI bot response and save it
  static async getAndSaveBotResponse(
    botSlug: string, 
    userId: string, 
    userMessage: string
  ): Promise<ChatMessage | null> {
    try {
      // Get AI response using the AI service
      const botResponse = await AIService.chat(botSlug as BotSlug, userMessage)
      return await this.saveMessage(botSlug, userId, botResponse, false)
    } catch (error) {
      console.error('Error getting AI bot response:', error)
      return null
    }
  }

  // Get AI bot response with streaming
  static async getAndSaveBotResponseStream(
    botSlug: string, 
    userId: string, 
    userMessage: string,
    onChunk: (chunk: string) => void
  ): Promise<ChatMessage | null> {
    try {
      console.log('ChatService: Getting AI response for', botSlug, 'with message:', userMessage);
      // Get AI response using streaming
      const botResponse = await AIService.chatStream(botSlug as BotSlug, userMessage, onChunk)
      console.log('ChatService: Received AI response:', botResponse);
      return await this.saveMessage(botSlug, userId, botResponse, false)
    } catch (error) {
      console.error('Error getting AI bot response stream:', error)
      return null
    }
  }

  // Initialize chat with welcome message if no history exists
  static async initializeChat(botSlug: string, userId: string): Promise<ChatMessage | null> {
    try {
      const history = await this.loadChatHistory(botSlug)
      
      // If no history exists, create welcome message
      if (history.length === 0) {
        const welcomeMessage = getBotWelcomeMessage(botSlug as BotSlug)
        return await this.saveMessage(botSlug, userId, welcomeMessage, false)
      }
      
      return null
    } catch (error) {
      console.error('Error initializing chat:', error)
      return null
    }
  }

  // Initialize AI chat for a bot
  static initAIChat(botSlug: string, historyLimit = 64) {
    try {
      AIService.initChat(botSlug as BotSlug, historyLimit)
    } catch (error) {
      console.error('Error initializing AI chat:', error)
    }
  }

  // Clear AI chat history for a bot
  static clearAIChatHistory(botSlug: string) {
    try {
      AIService.clearChatHistory(botSlug as BotSlug)
    } catch (error) {
      console.error('Error clearing AI chat history:', error)
    }
  }

  // Note: clearChatHistory and getChatStats methods removed as no RPC functions are available
  // These features are skipped for now as requested
}
