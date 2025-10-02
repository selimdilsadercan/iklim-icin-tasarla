  "use client";

import AppBar from "@/components/AppBar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/hooks/useTranslations";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const t = useTranslations('profile');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    return (
      <ProtectedRoute>
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
            <AppBar currentPage="profile" />
          
          {/* Main Content with bottom padding for fixed bottom navigation */}
          <div className="pt-8 px-6 pb-24 min-h-screen">
            <div className="max-w-sm mx-auto">
              {/* Profile Header */}
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {user?.email?.split('@')[0] || t('unknown')}
                </h2>
                <p className="text-gray-600 text-sm mb-2">
                  {t('userType')}
                </p>
                <p className="text-gray-500 text-xs">
                  {user?.email}
                </p>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t('verifiedAccount')}
                </div>
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/80 rounded-2xl p-3 text-center border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-green-600">
                    {user?.created_at ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                  </div>
                  <div className="text-xs text-gray-600">{t('daysMember')}</div>
                </div>
                <div className="bg-white/80 rounded-2xl p-3 text-center border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">
                    {user?.last_sign_in_at ? t('active') : t('inactive')}
                  </div>
                  <div className="text-xs text-gray-600">{t('status')}</div>
                </div>
                <div className="bg-white/80 rounded-2xl p-3 text-center border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">
                    {user?.email_confirmed_at ? '✓' : '○'}
                  </div>
                  <div className="text-xs text-gray-600">{t('emailStatus')}</div>
                </div>
              </div>

              {/* Language Settings */}
              <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{t('language')}</h3>
                  </div>
                  <div className="flex-shrink-0">
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>

              {/* Profile Sections */}
              <div className="space-y-4">

                {/* Member Since */}
                <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{t('memberSince')}</h3>
                      <p className="text-sm text-gray-600">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : t('unknown')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Last Sign In */}
                <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{t('lastSignIn')}</h3>
                      <p className="text-sm text-gray-600">
                        {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : t('unknown')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Privacy Policy */}
                <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                  <Link
                    href="/privacy"
                    className="w-full flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold">Gizlilik Politikası</h3>
                      <p className="text-sm text-gray-500">Veri koruma ve gizlilik haklarınız</p>
                    </div>
                    <div className="text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full flex items-center gap-3 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold">{t('logout')}</h3>
                    </div>
                    <div className="text-red-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-[#00000090] flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('logoutConfirm')}</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {t('logoutMessage')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={async () => {
                      await signOut();
                      setShowLogoutConfirm(false);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {t('logout')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ProtectedRoute>
    );
  }
