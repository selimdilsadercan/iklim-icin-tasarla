"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useBeta } from "@/contexts/BetaContext";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const { enableBetaMode, setBetaUser } = useBeta();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push("/home");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        router.push("/home");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBetaMode = () => {
    // Create a test user for beta mode
    const testUser = {
      id: 'beta-user-' + Date.now(),
      name: 'Test Kullanıcısı',
      email: 'test@beta.com'
    };
    
    setBetaUser(testUser);
    enableBetaMode();
    router.push("/beta/home");
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden">
        {/* Climate-themed Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating leaves */}
          <div className="absolute top-16 right-6 w-10 h-10 text-green-300 opacity-60">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.75 3.37C15.84 1.46 13.13 1 12 1s-3.84.46-5.75 2.37C4.36 5.26 3 7.62 3 10.5c0 2.88 1.36 5.24 3.25 7.13C8.16 19.54 10.87 20 12 20s3.84-.46 5.75-2.37C19.64 16.74 21 14.38 21 10.5s-1.36-5.24-3.25-7.13z"/>
            </svg>
          </div>
          <div className="absolute top-32 left-8 w-8 h-8 text-blue-300 opacity-60">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="absolute bottom-40 right-12 w-12 h-12 text-green-300 opacity-60">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          
          {/* Subtle cloud patterns */}
          <div className="absolute top-24 left-16 w-20 h-10 bg-blue-200 rounded-full opacity-40"></div>
          <div className="absolute bottom-32 right-20 w-16 h-8 bg-green-200 rounded-full opacity-40"></div>
        </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-full justify-center items-center pb-20">
          {/* Header Section */}
          <div className="flex flex-col items-center justify-center px-6 py-8">
            {/* App Logo + Title - Aligned and Compact */}
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-16 h-16 shadow-lg">
                  <Image 
                    src="/logo.png" 
                    alt="İklim İçin Tasarla Logo" 
                    width={64} 
                    height={64} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  İklim İçin Tasarla
                </h1>
              </div>
              <p className="text-center text-gray-600 text-sm">
                İklim Asistanları ile tanışmaya hazır mısın?
              </p>
            </div>

            {/* Login Form */}
            <div className="w-full max-w-sm space-y-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
                      <p className="text-red-600 text-sm text-center">{error}</p>
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      E-posta
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200 bg-white/80"
                        placeholder="E-posta adresinizi girin"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Şifre
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200 bg-white/80"
                        placeholder="Şifrenizi girin"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Main Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-bold py-3 px-4 rounded-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.2)] transform hover:translate-y-1 active:translate-y-2 transition-all duration-150 ease-out border-b-4 border-green-700 hover:border-green-600 active:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-base">{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</span>
                      {!loading && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* Beta Test Button */}
                  <div className="mt-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gradient-to-br from-blue-50 via-white to-green-50 text-gray-500">
                          Test için
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleBetaMode}
                      className="mt-8 group relative w-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white font-bold py-3 px-4 rounded-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.2)] transform hover:translate-y-1 active:translate-y-2 transition-all duration-150 ease-out border-b-4 border-blue-700 hover:border-blue-600 active:border-blue-500"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-base">Hesap Olmadan Devam Et</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>
  );
}
