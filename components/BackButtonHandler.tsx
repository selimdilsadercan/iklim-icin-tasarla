"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App } from '@capacitor/app';

// Extend Window interface to include Capacitor
declare global {
  interface Window {
    Capacitor?: any;
  }
}

export default function BackButtonHandler() {
  const router = useRouter();

  useEffect(() => {
    // Only run on mobile platforms
    if (typeof window !== 'undefined' && window.Capacitor) {
      // Add back button listener
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          // If we can go back in the web view, do nothing (let the browser handle it)
          return;
        } else {
          // If we can't go back in the web view, handle navigation manually
          const currentPath = window.location.pathname;
          
          // Define navigation hierarchy
          if (currentPath.startsWith('/chat/')) {
            // From chat pages, go back to home
            router.push('/home');
          } else if (currentPath === '/profile') {
            // From profile, go to home
            router.push('/home');
          } else if (currentPath === '/class') {
            // From class, go to home
            router.push('/home');
          } else if (currentPath === '/home') {
            // From home, minimize the app instead of closing
            App.minimizeApp();
          } else {
            // For any other page, go to home
            router.push('/home');
          }
        }
      });
    }
  }, [router]);

  // This component doesn't render anything
  return null;
}
