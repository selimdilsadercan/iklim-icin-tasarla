"use client";

import { useState, useEffect } from "react";
import AppBar from "@/components/AppBar";
import Link from "next/link";
import { UserStatsService } from "@/lib/user-stats-service";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

export default function HomePage() {
  const { user } = useAuth();
  const [assistantStats, setAssistantStats] = useState({
    yaprak: { totalConversations: 0, lastActive: "Yükleniyor..." },
    robi: { totalConversations: 0, lastActive: "Yükleniyor..." },
    bugday: { totalConversations: 0, lastActive: "Yükleniyor..." },
    damla: { totalConversations: 0, lastActive: "Yükleniyor..." }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const stats = await UserStatsService.getFormattedUserBotStats(user.id);
      setAssistantStats(stats);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('İstatistikler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
        <AppBar currentPage="home" />
        
        {/* Main Content with bottom padding for fixed bottom navigation */}
        <div className="px-6 pb-24 pt-8 min-h-screen">
          <div className="max-w-sm mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Hoş Geldin! 🌱
              </h2>
              <p className="text-gray-600">
                Merak ettiğin konuda asistanlar ile konuşmaya başlayabilirsin!
              </p>  
              
              {/* Error State */}
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                  <button 
                    onClick={fetchStats}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}
              
            </div>

            {/* Character Assistants */}
            <div className="space-y-4">
              {/* Skeleton Loaders */}
              {loading && (
                <>
                  {/* Skeleton Card 1 */}
                  <div className="bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-20"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                        </div>
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-3 ml-15">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                      </div>
                    </div>
                  </div>

                  {/* Skeleton Card 2 */}
                  <div className="bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-16"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                        </div>
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-3 ml-15">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                      </div>
                    </div>
                  </div>

                  {/* Skeleton Card 3 */}
                  <div className="bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-18"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-22"></div>
                        </div>
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-3 ml-15">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                      </div>
                    </div>
                  </div>

                  {/* Skeleton Card 4 */}
                  <div className="bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-16"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-18"></div>
                        </div>
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-3 ml-15">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Actual Cards - Only show when not loading */}
              {!loading && (
                <>
                  {/* Yaprak - Çevre Asistanı */}
                  <Link href="/chat/yaprak" className="block">
                <div className="bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.1)] transform hover:translate-y-1 active:translate-y-2 transition-all duration-150 ease-out">
                <div className="flex flex-col gap-3">
                  {/* First row: Icon + Title + Right arrow */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl overflow-hidden">
                      <Image 
                        src="/bot/yaprak.jpeg" 
                        alt="Yaprak" 
                        width={48} 
                        height={48} 
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">Yaprak</h3>
                      <p className="text-sm text-gray-600">Çevre Asistanı</p>
                    </div>
                    <div className="text-green-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Second row: Statistics */}
                  <div className="flex items-center gap-3 ml-15">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-500">{assistantStats.yaprak.totalConversations} konuşma</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-500">{assistantStats.yaprak.lastActive}</span>
                    </div>
                  </div>
                </div>
              </div>
              </Link>

              {/* Robi - Enerji Asistanı */}
              <Link href="/chat/robi" className="block">
                <div className="bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.1)] transform hover:translate-y-1 active:translate-y-2 transition-all duration-150 ease-out">
                <div className="flex flex-col gap-3">
                  {/* First row: Icon + Title + Right arrow */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl overflow-hidden">
                      <Image 
                        src="/bot/robi.jpeg" 
                        alt="Robi" 
                        width={48} 
                        height={48} 
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">Robi</h3>
                      <p className="text-sm text-gray-600">Enerji Asistanı</p>
                    </div>
                    <div className="text-orange-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Second row: Statistics */}
                  <div className="flex items-center gap-3 ml-15">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="text-xs text-gray-500">{assistantStats.robi.totalConversations} konuşma</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-500">{assistantStats.robi.lastActive}</span>
                    </div>
                  </div>
                </div>
              </div>
              </Link>

              {/* Buğday - Tarım Asistanı */}
              <Link href="/chat/bugday" className="block">
                <div className="bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.1)] transform hover:translate-y-1 active:translate-y-2 transition-all duration-150 ease-out">
                <div className="flex flex-col gap-3">
                  {/* First row: Icon + Title + Right arrow */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl overflow-hidden">
                      <Image 
                        src="/bot/bugday.jpeg" 
                        alt="Buğday" 
                        width={48} 
                        height={48} 
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">Buğday</h3>
                      <p className="text-sm text-gray-600">Tarım Asistanı</p>
                    </div>
                    <div className="text-yellow-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Second row: Statistics */}
                  <div className="flex items-center gap-3 ml-15">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-xs text-gray-500">{assistantStats.bugday.totalConversations} konuşma</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-500">{assistantStats.bugday.lastActive}</span>
                    </div>
                  </div>
                </div>
              </div>
              </Link>

              {/* Damla - Su Asistanı */}
              <Link href="/chat/damla" className="block">
                <div className="bg-white/80 rounded-2xl p-5 border border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.1)] transform hover:translate-y-1 active:translate-y-2 transition-all duration-150 ease-out">
                <div className="flex flex-col gap-3">
                  {/* First row: Icon + Title + Right arrow */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl overflow-hidden">
                      <Image 
                        src="/bot/damla.jpeg" 
                        alt="Damla" 
                        width={48} 
                        height={48} 
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">Damla</h3>
                      <p className="text-sm text-gray-600">Su Asistanı</p>
                    </div>
                    <div className="text-blue-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Second row: Statistics */}
                  <div className="flex items-center gap-3 ml-15">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-xs text-gray-500">{assistantStats.damla.totalConversations} konuşma</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-500">{assistantStats.damla.lastActive}</span>
                    </div>
                  </div>
                </div>
              </div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
