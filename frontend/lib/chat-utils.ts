import { Database } from './supabase-types'

// Bot slug to index mapping
export const BOT_INDICES = {
  yaprak: 0,
  robi: 1,
  bugday: 2,
  damla: 3,
} as const

export type BotSlug = keyof typeof BOT_INDICES

// Chat history types
export type ChatMessage = Database['public']['Tables']['chat_history']['Row']
export type ChatMessageInsert = Database['public']['Tables']['chat_history']['Insert']

// Get bot index from slug
export function getBotIndex(botSlug: string): number {
  return BOT_INDICES[botSlug as BotSlug] ?? 0
}

// Get bot slug from index
export function getBotSlug(botIndex: number): BotSlug | null {
  const entry = Object.entries(BOT_INDICES).find(([_, index]) => index === botIndex)
  return entry ? (entry[0] as BotSlug) : null
}

// Bot welcome messages
export const BOT_WELCOME_MESSAGES: Record<BotSlug, string> = {
  yaprak: "Merhaba! Ben Yaprak, çevre dostu yaşam konusunda size yardımcı olmaya geldim. 🌱 Hangi konuda bilgi almak istiyorsunuz?",
  robi: "Selam! Ben Robi, enerji tasarrufu ve yenilenebilir enerji konularında uzmanım. ⚡ Nasıl yardımcı olabilirim?",
  bugday: "Merhaba! Ben Buğday, sürdürülebilir tarım ve gıda güvenliği konularında rehberinizim. 🌾 Hangi konuyu öğrenmek istiyorsunuz?",
  damla: "Selam! Ben Damla, su tasarrufu ve su kaynaklarının korunması konusunda size yardımcı olacağım. 💧 Hangi konuda bilgi almak istiyorsunuz?",
}

// Bot response templates
export const BOT_RESPONSES: Record<BotSlug, string[]> = {
  yaprak: [
    "Çevre dostu yaşam için geri dönüşüm çok önemli! 🗑️",
    "Doğaya saygılı ürünler kullanarak dünyamızı koruyabiliriz. 🌍",
    "Bitki yetiştirmek hem keyifli hem de çevreye faydalı! 🌿",
    "Plastik kullanımını azaltmak için cam şişeler tercih edin! 🍼",
    "Toplu taşıma kullanarak karbon ayak izinizi azaltabilirsiniz! 🚌",
  ],
  robi: [
    "Enerji tasarrufu için LED ampuller kullanmayı unutmayın! 💡",
    "Güneş enerjisi geleceğimiz için çok önemli! ☀️",
    "Elektronik cihazları kullanmadığınızda kapatmayı unutmayın! 🔌",
    "Rüzgar enerjisi temiz ve yenilenebilir bir kaynak! 💨",
    "Enerji verimli cihazlar seçerek tasarruf edebilirsiniz! ⚡",
  ],
  bugday: [
    "Organik tarım hem sağlıklı hem de sürdürülebilir! 🥬",
    "Yerel üreticileri desteklemek önemli! 🏡",
    "Gıda israfını önlemek için planlı alışveriş yapın! 🛒",
    "Kompost yaparak organik atıkları değerlendirin! 🍂",
    "Mevsimlik sebze ve meyveleri tercih edin! 🥕",
  ],
  damla: [
    "Su tasarrufu için kısa duş almayı unutmayın! 🚿",
    "Muslukları kapatmayı unutmayın! 🚰",
    "Yağmur suyunu toplamak harika bir fikir! ☔",
    "Su filtreleme sistemleri kullanarak temiz su elde edin! 💧",
    "Bahçe sulama için damla sulama sistemi kullanın! 🌱",
  ],
}

// Get random bot response
export function getBotResponse(botSlug: BotSlug, userMessage: string): string {
  const responses = BOT_RESPONSES[botSlug]
  return responses[Math.floor(Math.random() * responses.length)]
}

// Get bot welcome message
export function getBotWelcomeMessage(botSlug: BotSlug): string {
  return BOT_WELCOME_MESSAGES[botSlug]
}
