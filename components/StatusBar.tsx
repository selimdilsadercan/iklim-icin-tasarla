"use client";

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';

export default function StatusBarComponent() {
  useEffect(() => {
    const initializeStatusBar = async () => {
      try {
        // Set status bar style to dark content on light background
        await StatusBar.setStyle({ style: Style.Dark });
        
        // Set status bar background color to match home page gradient
        await StatusBar.setBackgroundColor({ color: '#eff6ff' });
        
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
