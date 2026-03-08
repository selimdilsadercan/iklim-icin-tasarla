"use client";

import { useRouter } from "next/navigation";

export function BetaBackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/beta/home")}
      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
    >
      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
