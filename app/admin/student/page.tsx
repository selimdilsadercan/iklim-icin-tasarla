"use client";

import { useState, useEffect, Suspense } from "react";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { StudentService, StudentDetail, StudentMessage } from "@/lib/student-service";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function StudentDetailPageContent() { 
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');
  
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [selectedBot, setSelectedBot] = useState<number | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'txt'>('csv');
  const [conversationScope, setConversationScope] = useState<'all' | 'student'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentDetail = async () => {
    console.log('fetchStudentDetail called with:', { user: !!user, studentId });
    
    if (!user || !studentId) {
      console.log('Missing user or studentId, setting loading false');
      setLoading(false);
      return;
    }

    try {
      console.log('Starting to fetch student detail for:', studentId);
      setLoading(true);
      setError(null);
      const detail = await StudentService.getStudentDetail(studentId);
      console.log('Student detail result:', detail);
      setStudentDetail(detail);
      
      // Set first bot as selected by default
      if (detail && detail.bot_interactions.length > 0) {
        setSelectedBot(detail.bot_interactions[0].bot_index);
      }
    } catch (err) {
      console.error('Error fetching student detail:', err);
      console.log('Setting error state');
      setError('Öğrenci detayları yüklenirken bir hata oluştu');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDetail();
  }, [user, studentId]);

  // Redirect if no studentId
  useEffect(() => {
    if (!studentId) {
      router.push('/admin/classes');
    }
  }, [studentId, router]);

  const handleDownload = () => {
    if (!studentDetail || selectedBot === null) return;
    
    // Download messages for selected bot only
    const botInteraction = studentDetail.bot_interactions.find(bot => bot.bot_index === selectedBot);
    if (botInteraction) {
      StudentService.downloadConversation(botInteraction.conversations, selectedFormat, conversationScope === 'student');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Bilinmiyor';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBotDisplayName = (botIndex: number) => {
    const botNames = ['Yaprak', 'Robi', 'Buğday', 'Damla'];
    return botNames[botIndex] || `Bot ${botIndex}`;
  };

  const getBotColor = (botIndex: number) => {
    const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-cyan-500'];
    return colors[botIndex] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
          <AdminSidebar currentPage={null} />
          <div className="lg:ml-64">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Öğrenci detayları yükleniyor...</p>
              </div>
            </div>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  if (error || !studentDetail) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
          <AdminSidebar currentPage={null} />
          <div className="lg:ml-64">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L17.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2 1.732 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Hata</h3>
                <p className="text-gray-600 text-sm mb-4">{error || 'Öğrenci bulunamadı'}</p>
                <button 
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Geri Dön
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  const currentBotInteraction = studentDetail.bot_interactions.find(bot => bot.bot_index === selectedBot);
  const allMessages = currentBotInteraction?.conversations || [];
  const currentMessages = conversationScope === 'student' 
    ? allMessages.filter(msg => msg.is_user)
    : allMessages;

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
        <AdminSidebar currentPage={null} />
        
        {/* Main Content */}
        <div className="lg:ml-64">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-sm lg:max-w-6xl mx-auto flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-800">
                  {studentDetail.display_name || 'Öğrenci'} için Konuşmalar
                </h1>
                <p className="text-sm text-gray-600">
                  {studentDetail.class_name || 'Sınıf bilgisi yok'} • {studentDetail.total_messages} mesaj
                </p>
              </div>
            </div>
          </div>

          {/* Content - Full Height Layout */}
          <div className="px-6 pb-24 lg:pb-8 pt-8 h-full">
            <div className="max-w-sm lg:max-w-6xl mx-auto h-full flex flex-col">
              
              {/* Chat Messages - Full Height */}
              <div className="bg-white/80 rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col">
                {/* Controls at the top of chat */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    
                    {/* Left: Bot Selection */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Bot Seçimi</h3>
                      <div className="flex flex-wrap gap-2">
                        {studentDetail.bot_interactions.map((bot) => (
                          <button
                            key={bot.bot_index}
                            onClick={() => setSelectedBot(bot.bot_index)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              selectedBot === bot.bot_index
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {getBotDisplayName(bot.bot_index)} ({bot.total_messages})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Center: Conversation Scope */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Görünüm</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConversationScope('all')}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            conversationScope === 'all'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Tümü
                        </button>
                        <button
                          onClick={() => setConversationScope('student')}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            conversationScope === 'student'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Sadece Öğrenci
                        </button>
                      </div>
                    </div>

                    {/* Right: Download Controls */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">İndir</h3>
                      <div className="flex gap-2">
                        {/* CSV Download */}
                        <button
                          onClick={() => {
                            setSelectedFormat('csv');
                            handleDownload();
                          }}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          CSV
                        </button>
                        
                        {/* JSON Download */}
                        <button
                          onClick={() => {
                            setSelectedFormat('json');
                            handleDownload();
                          }}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          JSON
                        </button>
                        
                        {/* TXT Download */}
                        <button
                          onClick={() => {
                            setSelectedFormat('txt');
                            handleDownload();
                          }}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          TXT
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {getBotDisplayName(selectedBot || 0)} ile Konuşma
                    </h2>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getBotColor(selectedBot || 0)}`}></div>
                      <span className="text-sm text-gray-600">
                        {currentBotInteraction?.total_messages || 0} mesaj
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages - Full Height */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {currentMessages.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-gray-600">Bu bot ile henüz konuşma yok</p>
                      </div>
                    ) : (
                      currentMessages.map((message, index) => (
                        <div
                          key={message.id}
                          className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.is_user
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {message.is_user ? (
                              <p className="text-sm">{message.message}</p>
                            ) : (
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
                                    code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">{children}</code>,
                                    blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic">{children}</blockquote>,
                                  }}
                                >
                                  {message.message}
                                </ReactMarkdown>
                              </div>
                            )}
                            <p className={`text-xs mt-1 ${
                              message.is_user ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}

export default function StudentDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <StudentDetailPageContent />
    </Suspense>
  );
}
