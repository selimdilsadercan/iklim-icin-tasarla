import { supabase } from './supabase'
import { ChatMessage, getBotIndex, getBotResponse, getBotWelcomeMessage, BotSlug } from './chat-utils'
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

  // Get bot response and save it
  static async getAndSaveBotResponse(
    botSlug: string, 
    userId: string, 
    userMessage: string
  ): Promise<ChatMessage | null> {
    try {
      const botResponse = getBotResponse(botSlug as BotSlug, userMessage)
      return await this.saveMessage(botSlug, userId, botResponse, false)
    } catch (error) {
      console.error('Error getting bot response:', error)
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

  // Note: clearChatHistory and getChatStats methods removed as no RPC functions are available
  // These features are skipped for now as requested
}
