import { BotSlug } from './chat-utils'

// AI Message types
export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  images?: string[]
}

export interface ChatRequest {
  model: string
  messages: AIMessage[]
  stream?: boolean
  keep_alive?: number
}

export interface ChatResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
  }>
  done?: boolean
}

export interface ChatStreamResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
  }>
  done: boolean
}

// Bot persona configurations
export interface BotPersona {
  name: string
  role: string
  systemPrompt: string
  model: string
  emoji: string
  color: string
  status: string
}

export const BOT_PERSONAS: Record<BotSlug, BotPersona> = {
  yaprak: {
    name: "Yaprak",
    role: "Çevre Dostu Yaşam Uzmanı",
    systemPrompt: `Sen Yaprak'sın, çevre dostu yaşam konusunda uzman bir asistansın. 
    Türkçe konuşuyorsun ve çevre koruma, sürdürülebilirlik, geri dönüşüm, 
    doğa dostu yaşam tarzı konularında yardımcı oluyorsun. 
    Kısa, anlaşılır ve pratik öneriler veriyorsun. 
    Emojiler kullanarak mesajlarını daha samimi hale getiriyorsun.`,
    model: "iklim-model-short:latest", // Your custom model
    emoji: "🌱",
    color: "bg-green-500",
    status: "Çevre dostu yaşam rehberi"
  },
  robi: {
    name: "Robi",
    role: "Enerji Tasarrufu Uzmanı",
    systemPrompt: `Sen Robi'sin, enerji tasarrufu ve yenilenebilir enerji konularında uzman bir asistansın.
    Türkçe konuşuyorsun ve enerji verimliliği, yenilenebilir enerji kaynakları,
    elektrik tasarrufu, sürdürülebilir enerji çözümleri konularında yardımcı oluyorsun.
    Teknik bilgileri basit dille açıklıyorsun ve pratik çözümler öneriyorsun.
    Emojiler kullanarak mesajlarını daha samimi hale getiriyorsun.`,
    model: "iklim-model-short:latest",
    emoji: "⚡",
    color: "bg-yellow-500",
    status: "Enerji tasarrufu rehberi"
  },
  bugday: {
    name: "Buğday",
    role: "Sürdürülebilir Tarım Uzmanı",
    systemPrompt: `Sen Buğday'sın, sürdürülebilir tarım ve gıda güvenliği konularında uzman bir asistansın.
    Türkçe konuşuyorsun ve organik tarım, gıda güvenliği, sürdürülebilir tarım uygulamaları,
    yerel üretim, gıda israfı önleme konularında yardımcı oluyorsun.
    Çiftçilik deneyimlerini ve pratik bilgileri paylaşıyorsun.
    Emojiler kullanarak mesajlarını daha samimi hale getiriyorsun.`,
    model: "iklim-model-short:latest",
    emoji: "🌾",
    color: "bg-amber-500",
    status: "Sürdürülebilir tarım rehberi"
  },
  damla: {
    name: "Damla",
    role: "Su Tasarrufu Uzmanı",
    systemPrompt: `Sen Damla'sın, su tasarrufu ve su kaynaklarının korunması konularında uzman bir asistansın.
    Türkçe konuşuyorsun ve su tasarrufu, su kalitesi, su kaynaklarının korunması,
    su filtreleme, yağmur suyu toplama konularında yardımcı oluyorsun.
    Suyun önemini vurguluyorsun ve pratik tasarruf yöntemleri öneriyorsun.
    Emojiler kullanarak mesajlarını daha samimi hale getiriyorsun.`,
    model: "iklim-model-short:latest",
    emoji: "💧",
    color: "bg-blue-500",
    status: "Su tasarrufu rehberi"
  }
}

// AI Service Configuration - Matching Unity API exactly
const AI_CONFIG = {
  server: "https://national-lion-quick.ngrok-free.app/",
  apiKey: "sk-654b15a71daa45d1b3e5a72b816d16be",
  endpoints: {
    chat: "api/chat/completions",
    generate: "api/generate", 
    list: "api/tags",
    embeddings: "api/embed"
  }
}

// Chat history management
class ChatHistoryManager {
  private histories: Map<string, AIMessage[]> = new Map()
  private systemPrompts: Map<string, AIMessage> = new Map()
  private historyLimit = 64

  initChat(botSlug: BotSlug, persona: BotPersona, historyLimit = 64) {
    const chatKey = this.getChatKey(botSlug)
    
    // Clear existing history
    this.histories.delete(chatKey)
    this.systemPrompts.delete(chatKey)
    
    // Initialize new chat
    this.histories.set(chatKey, [])
    this.systemPrompts.set(chatKey, {
      role: 'system',
      content: persona.systemPrompt
    })
    this.historyLimit = historyLimit
  }

  addMessage(botSlug: BotSlug, message: AIMessage) {
    const chatKey = this.getChatKey(botSlug)
    const history = this.histories.get(chatKey) || []
    
    history.push(message)
    
    // Maintain history limit
    while (history.length > this.historyLimit) {
      history.shift()
    }
    
    this.histories.set(chatKey, history)
  }

  getMessages(botSlug: BotSlug): AIMessage[] {
    const chatKey = this.getChatKey(botSlug)
    const history = this.histories.get(chatKey) || []
    const systemPrompt = this.systemPrompts.get(chatKey)
    
    if (systemPrompt) {
      return [systemPrompt, ...history]
    }
    
    return history
  }

  clearHistory(botSlug: BotSlug) {
    const chatKey = this.getChatKey(botSlug)
    this.histories.delete(chatKey)
  }

  private getChatKey(botSlug: BotSlug): string {
    return `chat_${botSlug}`
  }
}

// AI Service class
export class AIService {
  private static historyManager = new ChatHistoryManager()
  private static availableModels: string[] = []
  private static fallbackModel = "iklim-model-short:latest" // Fallback model

  // Initialize chat for a bot
  static initChat(botSlug: BotSlug, historyLimit = 64) {
    const persona = BOT_PERSONAS[botSlug]
    if (!persona) {
      throw new Error(`Unknown bot slug: ${botSlug}`)
    }
    
    this.historyManager.initChat(botSlug, persona, historyLimit)
  }

  // Send a message and get AI response
  static async chat(botSlug: BotSlug, userMessage: string): Promise<string> {
    const persona = BOT_PERSONAS[botSlug]
    if (!persona) {
      throw new Error(`Unknown bot slug: ${botSlug}`)
    }

    // Initialize chat if not already done
    if (!this.historyManager.getMessages(botSlug).length) {
      this.initChat(botSlug)
    }

    // Add user message to history
    this.historyManager.addMessage(botSlug, {
      role: 'user',
      content: userMessage
    })

    // Get all messages including system prompt
    const messages = this.historyManager.getMessages(botSlug)

    // Create request with best available model (matching Unity API)
    const request: ChatRequest = {
      model: this.getBestModel(botSlug),
      messages: messages,
      stream: false,
      keep_alive: 300 // 5 minutes in seconds, matching Unity KeepAlive.five_minute
    }

    try {
      const response = await this.postRequest<ChatResponse>(request, AI_CONFIG.endpoints.chat)
      
      const aiResponse = response.choices[0]?.message?.content || "Şu anda bir cevap üretemedim, lütfen tekrar dene."
      
      // Add AI response to history
      this.historyManager.addMessage(botSlug, {
        role: 'assistant',
        content: aiResponse
      })

      return aiResponse
    } catch (error) {
      console.error('AI Chat error:', error)
      return "Üzgünüm, şu anda bir hata oluştu. Lütfen tekrar deneyin."
    }
  }

  // Stream a response from AI
  static async chatStream(
    botSlug: BotSlug, 
    userMessage: string, 
    onChunk: (chunk: string) => void
  ): Promise<string> {
    console.log('AIService: Starting chatStream for', botSlug, 'with message:', userMessage);
    const persona = BOT_PERSONAS[botSlug]
    if (!persona) {
      throw new Error(`Unknown bot slug: ${botSlug}`)
    }
    console.log('AIService: Using persona:', persona.name, 'with model:', persona.model);

    // Initialize chat if not already done
    if (!this.historyManager.getMessages(botSlug).length) {
      this.initChat(botSlug)
    }

    // Add user message to history
    this.historyManager.addMessage(botSlug, {
      role: 'user',
      content: userMessage
    })

    // Get all messages including system prompt
    const messages = this.historyManager.getMessages(botSlug)

    // Create request with best available model (matching Unity API)
    const modelToUse = this.getBestModel(botSlug);
    console.log('AIService: Using model:', modelToUse);
    const request: ChatRequest = {
      model: modelToUse,
      messages: messages,
      stream: true,
      keep_alive: 300 // 5 minutes in seconds, matching Unity KeepAlive.five_minute
    }
    console.log('AIService: Request payload:', JSON.stringify(request, null, 2));

    let fullResponse = ""

    try {
      await this.postRequestStream(request, AI_CONFIG.endpoints.chat, (response: any) => {
        console.log('AIService: Received chunk:', response);
        
        // Handle different response formats
        if (response.choices && response.choices[0]) {
          const choice = response.choices[0];
          
          // Handle delta format (streaming)
          if (choice.delta && choice.delta.content) {
            const chunk = choice.delta.content;
            fullResponse += chunk;
            onChunk(chunk);
          }
          // Handle message format (non-streaming)
          else if (choice.message && choice.message.content) {
            const chunk = choice.message.content;
            fullResponse += chunk;
            onChunk(chunk);
          }
        }
      })

      // Add full AI response to history
      if (fullResponse) {
        this.historyManager.addMessage(botSlug, {
          role: 'assistant',
          content: fullResponse
        })
      }

      return fullResponse
    } catch (error) {
      console.error('AI Chat Stream error:', error)
      const errorMessage = "Üzgünüm, şu anda bir hata oluştu. Lütfen tekrar deneyin."
      onChunk(errorMessage)
      return errorMessage
    }
  }

  // Get bot persona
  static getBotPersona(botSlug: BotSlug): BotPersona {
    const persona = BOT_PERSONAS[botSlug]
    if (!persona) {
      throw new Error(`Unknown bot slug: ${botSlug}`)
    }
    return persona
  }

  // Get available models from the server
  static async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.getRequest<{models: Array<{name: string}>}>(AI_CONFIG.endpoints.list)
      this.availableModels = response.models?.map((model: {name: string}) => model.name) || []
      return this.availableModels
    } catch (error) {
      console.error('Error fetching available models:', error)
      return []
    }
  }

  // Get the best available model for a bot
  private static getBestModel(botSlug: BotSlug): string {
    const persona = BOT_PERSONAS[botSlug]
    if (!persona) return this.fallbackModel

    // If we have available models, try to find the persona's preferred model
    if (this.availableModels.length > 0) {
      // Try exact match first
      if (this.availableModels.includes(persona.model)) {
        return persona.model
      }
      
      // Try partial match (e.g., "llama3.1" matches "llama3.1:8b")
      const partialMatch = this.availableModels.find(model => 
        model.includes(persona.model.split(':')[0])
      )
      if (partialMatch) {
        return partialMatch
      }
      
      // Try common model variations
      const baseModel = persona.model.split(':')[0]
      const variations = [
        baseModel,
        `${baseModel}:latest`,
        `${baseModel}:8b`,
        `${baseModel}:7b`,
        `${baseModel}:13b`,
        'iklim-model-short:latest',
        'iklim-model-short',
        'llama3.1',
        'llama3.1:8b',
        'llama3.1:7b',
        'llama3',
        'llama3:8b',
        'llama3:7b'
      ]
      
      for (const variation of variations) {
        if (this.availableModels.includes(variation)) {
          return variation
        }
      }
      
      // Use first available model as fallback
      return this.availableModels[0]
    }

    // If no models fetched, use persona's model or fallback
    return persona.model || this.fallbackModel
  }

  // Clear chat history for a bot
  static clearChatHistory(botSlug: BotSlug) {
    this.historyManager.clearHistory(botSlug)
  }

  // HTTP request methods
  private static async getRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${AI_CONFIG.server}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'ngrok-skip-browser-warning': 'true'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }

  private static async postRequest<T>(payload: any, endpoint: string): Promise<T> {
    const response = await fetch(`${AI_CONFIG.server}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }

  private static async postRequestStream(
    payload: any, 
    endpoint: string, 
    onChunk: (chunk: ChatStreamResponse) => void
  ): Promise<void> {
    console.log('AIService: Making request to:', `${AI_CONFIG.server}${endpoint}`);
    console.log('AIService: Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${AI_CONFIG.server}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    })

    console.log('AIService: Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AIService: Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body reader available')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue
          
          try {
            // Handle Server-Sent Events format with "data:" prefix
            let jsonLine = line
            if (line.startsWith('data: ')) {
              jsonLine = line.substring(6) // Remove "data: " prefix
            }
            
            // Skip special SSE events
            if (jsonLine === '[DONE]' || jsonLine.trim() === '') {
              continue
            }
            
            const jsonData = JSON.parse(jsonLine)
            onChunk(jsonData)
          } catch (e) {
            console.warn('Failed to parse JSON chunk:', line)
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}
