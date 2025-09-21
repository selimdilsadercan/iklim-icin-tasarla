"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChatService } from "@/lib/chat-service";
import { ChatMessage } from "@/lib/chat-utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
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

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || sending) return;

    const userMessageText = inputText.trim();
    setInputText("");
    setSending(true);

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

        // Get and save bot response
        const botResponse = await ChatService.getAndSaveBotResponse(botSlug, user.id, userMessageText);
        
        if (botResponse) {
          const botMsg: Message = {
            id: botResponse.id,
            text: botResponse.message,
            isBot: true,
            timestamp: new Date(botResponse.created_at || Date.now()),
          };
          setMessages(prev => [...prev, botMsg]);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
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

  return (
    <>
      {/* Chat Messages */}
      <div className="px-4 pb-4 pt-4 flex-1 overflow-y-auto relative z-10 flex flex-col-reverse space-y-reverse space-y-3">
        {messages.slice().reverse().map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
          >
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
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
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
        ))}
        
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white/90 backdrop-blur-sm text-gray-800 border border-white/20 px-4 py-2 rounded-2xl shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse">Bot yazıyor</div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 relative z-20">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mesajınızı yazın..."
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
    </>
  );
}
