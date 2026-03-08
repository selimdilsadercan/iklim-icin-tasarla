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
    let backButtonListener: any = null;

    const initializeBackButton = async () => {
      // Only run on mobile platforms
      if (typeof window !== 'undefined' && window.Capacitor) {
        try {
          // Add back button listener
          backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
            console.log('Back button pressed, canGoBack:', canGoBack);
            
            if (canGoBack) {
              // If we can go back in the web view, use browser history
              window.history.back();
            } else {
              // If we can't go back in the web view, handle navigation manually
              const currentPath = window.location.pathname;
              console.log('Current path:', currentPath);
              
              // Define navigation hierarchy
              if (currentPath.startsWith('/chat/')) {
                // From chat pages, go back to home
                router.push('/home');
              } else if (currentPath === '/profile' || currentPath === '/class' || currentPath === '/home') {
                // On home, class, and profile pages - do nothing (disable back navigation)
                console.log('Back button disabled on main pages');
                return; // Do nothing, prevent navigation
              } else {
                // For any other page, go to home
                router.push('/home');
              }
            }
          });
          
          console.log('Back button listener added successfully');
        } catch (error) {
          console.error('Error adding back button listener:', error);
        }
      }
    };

    // Initialize after a short delay to ensure Capacitor is ready
    const timer = setTimeout(initializeBackButton, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (backButtonListener) {
        backButtonListener.remove();
        console.log('Back button listener removed');
      }
    };
  }, [router]);

  // This component doesn't render anything
  return null;
}
