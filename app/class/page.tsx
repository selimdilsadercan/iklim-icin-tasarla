"use client";

import AppBar from "@/components/AppBar";

export default function ClassPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
        <AppBar currentPage="class" />
        
        {/* Main Content with bottom padding for fixed bottom navigation */}
        <div className="px-6 pb-24 pt-8 min-h-screen">
          <div className="max-w-sm mx-auto">
            {/* Coming Soon Section */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Yakında Geliyor! 🚀
              </h2>
              
              <p className="text-gray-600 mb-6">
                Sınıf özelliği şu anda geliştiriliyor
              </p>
              
              <div className="bg-white/80 rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Ne Geliyor?
                </h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">İlerleme takibi</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">İnteraktif simulasyonlarla öğrenme</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">Rozet sistemi</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-6">
                Bu özellik için sabırsızlanıyoruz! 🌱
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
