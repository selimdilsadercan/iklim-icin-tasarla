'use client';

import { useLocale } from '@/contexts/LocaleContext';
import { useTranslations } from '@/hooks/useTranslations';
import { locales } from '@/i18n';
import { useState } from 'react';

// Flag emojis for each language
const flagMap = {
  'tr': '🇹🇷',
  'en': '🇺🇸',
  'es': '🇪🇸',
  'fr': '🇫🇷'
};

export default function LanguageSwitcher() {
  const t = useTranslations('languages');
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale as any);
    setIsOpen(false);
  };

  const currentFlag = flagMap[locale as keyof typeof flagMap];
  const currentLanguage = t(locale);

  return (
    <div className="relative">
      {/* Custom Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[120px]"
      >
        <span className="text-lg">{currentFlag}</span>
        <span className="flex-1 text-left">{currentLanguage}</span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {locales.map((loc) => {
            const flag = flagMap[loc as keyof typeof flagMap];
            const languageName = t(loc);
            const isSelected = locale === loc;
            
            return (
              <button
                key={loc}
                onClick={() => handleLanguageChange(loc)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors duration-150 ${
                  isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{flag}</span>
                <span className="flex-1">{languageName}</span>
                {isSelected && (
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
