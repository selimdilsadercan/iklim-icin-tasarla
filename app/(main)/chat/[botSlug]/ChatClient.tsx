"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChatService } from "@/lib/chat-service";
import { ChatMessage } from "@/lib/chat-utils";
import { AIService, BOT_PERSONAS } from "@/lib/ai-service";
import { useTranslations } from "@/hooks/useTranslations";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Helper function to format date for day indicators
const formatDateForIndicator = (date: Date, t: any): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const messageDate = new Date(date);
  
  // Reset time to compare only dates
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  if (messageDateOnly.getTime() === todayDate.getTime()) {
    return t('today');
  } else if (messageDateOnly.getTime() === yesterdayDate.getTime()) {
    return t('yesterday');
  } else {
    return messageDate.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }
};

// Helper function to check if two dates are on different days
const isDifferentDay = (date1: Date, date2: Date): boolean => {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return d1.getTime() !== d2.getTime();
};

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatClientProps {
  botSlug: string;
}

export default function ChatClient({ botSlug }: ChatClientProps) {
  const { user } = useAuth();
  const t = useTranslations('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Initialize AI chat for this bot
        console.log('Initializing AI chat for bot:', botSlug);
        ChatService.initAIChat(botSlug);
        
        // Load existing chat history
        const history = await ChatService.loadChatHistory(botSlug);
        
        // Convert Supabase messages to local message format
        const formattedMessages: Message[] = history.map((msg: ChatMessage) => ({
          id: msg.id,
          text: msg.message,
          isBot: !msg.is_user,
          timestamp: new Date(msg.created_at || Date.now()),
        }));

        setMessages(formattedMessages);

        // If no history exists, initialize with welcome message
        if (formattedMessages.length === 0) {
          const welcomeMessage = await ChatService.initializeChat(botSlug, user.id);
          if (welcomeMessage) {
            setMessages([{
              id: welcomeMessage.id,
              text: welcomeMessage.message,
              isBot: true,
              timestamp: new Date(welcomeMessage.created_at || Date.now()),
            }]);
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [botSlug, user]);

  // Auto-scroll to bottom when messages change or streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage, isStreaming]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || sending || isStreaming) return;

    const userMessageText = inputText.trim();
    setInputText("");
    setSending(true);
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      // Save user message
      const userMessage = await ChatService.saveMessage(botSlug, user.id, userMessageText, true);
      
      if (userMessage) {
        // Add user message to UI
        const userMsg: Message = {
          id: userMessage.id,
          text: userMessage.message,
          isBot: false,
          timestamp: new Date(userMessage.created_at || Date.now()),
        };
        setMessages(prev => [...prev, userMsg]);

        // Get and save bot response with streaming
        console.log('Getting AI response for bot:', botSlug, 'message:', userMessageText);
        const botResponse = await ChatService.getAndSaveBotResponseStream(
          botSlug, 
          user.id, 
          userMessageText,
          (chunk: string) => {
            console.log('Received chunk:', chunk);
            setStreamingMessage(prev => {
              const newMessage = prev + chunk;
              console.log('Updated streaming message:', newMessage);
              return newMessage;
            });
          }
        );
        
        if (botResponse) {
          const botMsg: Message = {
            id: botResponse.id,
            text: botResponse.message,
            isBot: true,
            timestamp: new Date(botResponse.created_at || Date.now()),
          };
          setMessages(prev => [...prev, botMsg]);
        }
        
        // Clear streaming state after adding final message
        setIsStreaming(false);
        setStreamingMessage("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
      setStreamingMessage("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Note: Clear chat functionality removed as no RPC function is available

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Debug logging
  console.log('ChatClient render - isStreaming:', isStreaming, 'streamingMessage length:', streamingMessage.length, 'streamingMessage:', streamingMessage);

  return (
    <>
      {/* Chat Messages */}
      <div className="px-4 pb-4 pt-4 flex-1 overflow-y-auto relative z-10 flex flex-col space-y-3">
        {messages.map((message, index) => {
          // Get the chronologically previous message
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const showDayIndicator = !previousMessage || isDifferentDay(message.timestamp, previousMessage.timestamp);
          
          return (
            <div key={message.id}>
              {/* Day Indicator */}
              {showDayIndicator && (
                <div className="flex justify-center my-4">
                  <div className="bg-gray-600/80 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                    {formatDateForIndicator(message.timestamp, t)}
                  </div>
                </div>
              )}
              
              {/* Message */}
              <div className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl shadow-sm ${
                    message.isBot
                      ? "bg-white/90 backdrop-blur-sm text-gray-800 border border-white/20"
                      : "bg-green-500 text-white shadow-md"
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
                    message.isBot ? "text-gray-400" : "text-green-100"
                  }`}>
                    {message.timestamp.toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Streaming message */}
        {isStreaming && (
          <div>
            {/* Day indicator for streaming message if it's a new day */}
            {messages.length > 0 && isDifferentDay(new Date(), messages[messages.length - 1].timestamp) && (
              <div className="flex justify-center my-4">
                <div className="bg-gray-600/80 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                  {formatDateForIndicator(new Date(), t)}
                </div>
              </div>
            )}
            
            <div className="flex justify-start">
              <div className="bg-white/90 backdrop-blur-sm text-gray-800 border border-white/20 px-4 py-2 rounded-2xl shadow-sm">
                <div className="text-sm prose prose-sm max-w-none">
                  {streamingMessage ? (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Streaming ({streamingMessage.length} chars):</div>
                      <div className="whitespace-pre-wrap">{streamingMessage}</div>
                    </div>
                  ) : (
                    <div className="text-gray-500">{t('typing')}</div>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="text-xs text-gray-400">{t('typing')}</div>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator when sending but not streaming yet */}
        {sending && !isStreaming && (
          <div className="flex justify-start">
            <div className="bg-white/90 backdrop-blur-sm text-gray-800 border border-white/20 px-4 py-2 rounded-2xl shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse">{t('botTyping')}</div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}j
      <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 relative z-20">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('sendMessage')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 placeholder-gray-400"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || sending || isStreaming}
            className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(sending || isStreaming) ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
