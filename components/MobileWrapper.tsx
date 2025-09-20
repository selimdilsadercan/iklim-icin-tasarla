'use client';

import React, { useState, useEffect } from 'react';

interface MobileWrapperProps {
  children: React.ReactNode;
  deviceType?: 'iphone' | 'android' | 'generic';
  width?: number;
  height?: number;
  showDeviceFrame?: boolean;
  showStatusBar?: boolean;
}

export default function MobileWrapper({ 
  children, 
  deviceType = 'iphone',
  width = 375,
  height = 812,
  showDeviceFrame = true,
  showStatusBar = true
}: MobileWrapperProps) {
  const [isLandscape, setIsLandscape] = useState(false);
  const [dimensions, setDimensions] = useState({ width, height });
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const getDeviceStyles = () => {
    switch (deviceType) {
      case 'iphone':
        return {
          container: 'bg-gradient-to-b from-gray-900 to-gray-800 rounded-[3rem] p-3 shadow-2xl border border-gray-700',
          screen: 'bg-black rounded-[2.5rem] overflow-hidden relative',
          notch: 'absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-10',
          homeIndicator: 'absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full opacity-60'
        };
      case 'android':
        return {
          container: 'bg-gradient-to-b from-gray-800 to-gray-700 rounded-2xl p-2 shadow-xl border border-gray-600',
          screen: 'bg-black rounded-xl overflow-hidden relative',
          notch: 'absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-black rounded-b-2xl z-10',
          homeIndicator: 'absolute bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-white rounded-full opacity-60'
        };
      default:
        return {
          container: 'bg-gray-700 rounded-lg p-2 shadow-lg border border-gray-600',
          screen: 'bg-white rounded-md overflow-hidden relative',
          notch: '',
          homeIndicator: ''
        };
    }
  };

  const styles = getDeviceStyles();

  const toggleOrientation = () => {
    setIsLandscape(!isLandscape);
  };

  useEffect(() => {
    // Set client-side flag
    setIsClient(true);
    
    const getResponsiveDimensions = () => {
      if (typeof window !== 'undefined') {
        if (isLandscape) {
          return {
            width: Math.min(height, window.innerWidth - 100),
            height: Math.min(width, window.innerHeight - 100)
          };
        }
        return {
          width: Math.min(width, window.innerWidth - 100),
          height: Math.min(height, window.innerHeight - 100)
        };
      }
      return { width, height };
    };

    const checkIsMobile = () => {
      if (typeof window !== 'undefined') {
        const isMobileDevice = window.innerWidth <= 768;
        console.log('Mobile check:', { width: window.innerWidth, isMobile: isMobileDevice });
        setIsMobile(isMobileDevice);
      }
    };

    setDimensions(getResponsiveDimensions());
    checkIsMobile();

    const handleResize = () => {
      setDimensions(getResponsiveDimensions());
      checkIsMobile();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height, isLandscape]);

  // Debug logging
  console.log('MobileWrapper Debug:', { showDeviceFrame, isClient, isMobile, shouldHide: !showDeviceFrame || (isClient && isMobile) });

  // Hide frame if explicitly disabled OR if on mobile (after hydration)
  if (!showDeviceFrame || (isClient && isMobile)) {
    return (
      <div className="h-screen w-full">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Device Frame */}
      <div className={`${styles.container} relative transform transition-all duration-300 ${isLandscape ? 'rotate-90' : ''}`}>
        {/* Device Notch */}
        {deviceType !== 'generic' && showStatusBar && <div className={styles.notch} />}
        
        {/* Screen */}
        <div 
          className={styles.screen}
          style={{ 
            width: `${dimensions.width}px`, 
            height: `${dimensions.height}px`,
            maxWidth: '100vw',
            maxHeight: '100vh'
          }}
        >
          {/* Status Bar */}
          {deviceType !== 'generic' && showStatusBar && (
            <div className="absolute top-0 left-0 right-0 h-6 bg-black flex items-center justify-between px-4 text-white text-xs z-20">
              <span>9:41</span>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-2 border border-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
          )}
          
          {/* Content Area */}
          <div className={`w-full h-full ${deviceType !== 'generic' && showStatusBar ? 'pt-6' : ''}`}>
            {children}
          </div>

          {/* Home Indicator */}
          {deviceType !== 'generic' && <div className={styles.homeIndicator} />}
        </div>
      </div>

    </div>
  );
}
