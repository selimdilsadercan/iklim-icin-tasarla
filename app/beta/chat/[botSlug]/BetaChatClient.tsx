"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBeta } from "@/contexts/BetaContext";
import { BOT_PERSONAS } from "@/lib/ai-service";
import { BotSlug } from "@/lib/chat-utils";
import { BetaChatService } from "@/lib/beta-chat-service";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ExampleQuestions from "@/components/ExampleQuestions";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface BetaChatClientProps {
  botSlug: string;
}

export default function BetaChatClient({ botSlug }: BetaChatClientProps) {
  const router = useRouter();
  const { betaUser, disableBetaMode } = useBeta();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const botInfo = BOT_PERSONAS[botSlug as BotSlug];

  useEffect(() => {
    if (!betaUser) {
      router.push("/login");
      return;
    }

    // Initialize AI chat for this bot
    BetaChatService.initChat(botSlug as BotSlug);
    
    // Add welcome message
    const welcomeMessage = BetaChatService.getWelcomeMessage(botSlug as BotSlug);
    setMessages([{
      id: 'welcome-' + Date.now(),
      text: welcomeMessage,
      isBot: true,
      timestamp: new Date()
    }]);
  }, [botSlug, betaUser, router]);

  // Auto-scroll to bottom when messages change or streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage, isStreaming]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const userMessage = inputText.trim();
    setInputText("");
    setSending(true);

    // Add user message
    const userMsg: Message = {
      id: 'user-' + Date.now(),
      text: userMessage,
      isBot: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Get AI response with streaming
      setIsStreaming(true);
      setStreamingMessage("");

      let finalMessage = "";
      await BetaChatService.getBotResponseStream(
        botSlug as BotSlug,
        userMessage,
        (chunk: string) => {
          setStreamingMessage(prev => prev + chunk);
          finalMessage += chunk;
        }
      );

      // Add bot response using the captured final message
      const botMsg: Message = {
        id: 'bot-' + Date.now(),
        text: finalMessage,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMsg: Message = {
        id: 'error-' + Date.now(),
        text: "Üzgünüm, şu anda bir hata oluştu. Lütfen tekrar deneyin.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm relative z-10 ${
                message.isBot
                  ? 'bg-white/90 backdrop-blur-sm text-gray-800 border border-white/20'
                  : 'bg-green-500 text-white shadow-md'
              }`}
            >
              <div className="text-sm prose prose-sm max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc list-outside mb-2 space-y-1 pl-4">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-outside mb-2 space-y-1 pl-4">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                    code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic">{children}</blockquote>,
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
              <p className={`text-xs mt-1 ${
                message.isBot ? 'text-gray-400' : 'text-green-100'
              }`}>
                {message.timestamp.toLocaleTimeString('tr-TR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        
        {/* Streaming message */}
        {isStreaming && streamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm bg-white/90 backdrop-blur-sm text-gray-800 border border-white/20 relative z-10">
              <div className="text-sm prose prose-sm max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc list-outside mb-2 space-y-1 pl-4">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-outside mb-2 space-y-1 pl-4">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                    code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic">{children}</blockquote>,
                  }}
                >
                  {streamingMessage}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Example Questions */}
      {messages.length <= 1 && (
        <div className="relative z-30 flex-shrink-0">
          <ExampleQuestions 
            botSlug={botSlug} 
            onQuestionClick={(question) => {
              setInputText(question);
            }}
          />
        </div>
      )}

      {/* Chat Input */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 sticky bottom-0 z-30 flex-shrink-0 pb-safe">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mesajınızı yazın..."
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 placeholder-gray-400"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || sending}
            className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
