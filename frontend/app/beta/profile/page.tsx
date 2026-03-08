"use client";

import AppBar from "@/components/AppBar";
import BetaBanner from "@/components/BetaBanner";

export default function BetaProfilePage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
        <BetaBanner />
        <AppBar currentPage="profile" />
        
        {/* Main Content with bottom padding for fixed bottom navigation */}
        <div className="px-6 pb-24 pt-8 min-h-screen">
          <div className="max-w-sm mx-auto">
            {/* Beta Mode Notice */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Beta Test Modu 🧪
              </h2>
              
              <p className="text-gray-600 mb-6">
                Profil özelliği beta modunda aktif değil
              </p>
              
              <div className="bg-white/80 rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Beta Modunda Neler Var?
                </h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">Asistanlarla konuşma</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">Tüm özellikleri test etme</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">Hesap gerektirmez</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Beta Test Modu</h4>
                    <p className="text-yellow-700 text-sm">
                      Bu modda konuşmalar kaydedilmez. Gerçek kullanım için hesap oluşturun.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-6">
                Profil özelliği için gerçek hesap gereklidir! 🌱
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
