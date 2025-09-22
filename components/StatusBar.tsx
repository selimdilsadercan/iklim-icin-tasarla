"use client";

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';

export default function StatusBarComponent() {
  useEffect(() => {
    const initializeStatusBar = async () => {
      try {
        // Set status bar style to dark content on light background (black text/icons)
        await StatusBar.setStyle({ style: Style.Light });
        
        // Set status bar background color to pure white
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
        
        // Show status bar (in case it was hidden)
        await StatusBar.show();
      } catch (error) {
        // StatusBar plugin is only available on mobile devices
        // This error is expected on web/desktop
        console.log('StatusBar plugin not available:', error);
      }
    };

    initializeStatusBar();
  }, []);

  return null; // This component doesn't render anything
}
