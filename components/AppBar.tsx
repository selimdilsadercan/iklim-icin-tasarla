"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppBar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-md mx-auto">
        <div className="flex items-center py-3 px-6 gap-6">
          <Link
            href="/home"
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive("/home")
                ? "text-green-600 bg-green-50"
                : "text-gray-600 hover:text-green-600"
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Ana Sayfa</span>
          </Link>

          <Link
            href="/class"
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive("/class")
                ? "text-green-600 bg-green-50"
                : "text-gray-600 hover:text-green-600"
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xs font-medium">Sınıf</span>
          </Link>

          <Link
            href="/profile"
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-xl transition-all duration-200 ${
              isActive("/profile")
                ? "text-green-600 bg-green-50"
                : "text-gray-600 hover:text-green-600"
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-medium">Profil</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
