'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { locales, defaultLocale, type Locale } from '@/i18n';
import trMessages from '@/messages/tr.json';
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';
import deMessages from '@/messages/de.json';
import nlMessages from '@/messages/nl.json';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Record<string, any>;
  isLoading: boolean;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Messages map for easy access
const messagesMap = {
  'tr': trMessages,
  'en': enMessages,
  'es': esMessages,
  'de': deMessages,
  'nl': nlMessages
};

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, any>>(messagesMap[defaultLocale]);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved locale from localStorage on mount first
  useEffect(() => {
    const savedLocale = localStorage.getItem('app-locale') as Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
  }, []);

  // Load messages for the current locale
  useEffect(() => {
    const loadMessages = () => {
      setIsLoading(true);
      try {
        const messagesData = messagesMap[locale];
        if (messagesData) {
          setMessages(messagesData);
        } else {
          console.error('Messages not found for locale:', locale);
          // Fallback to default locale
          setMessages(messagesMap[defaultLocale]);
        }
      } catch (error) {
        console.error('Failed to load messages for locale:', locale);
        // Fallback to default locale
        setMessages(messagesMap[defaultLocale]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('app-locale', newLocale);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, messages, isLoading }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
