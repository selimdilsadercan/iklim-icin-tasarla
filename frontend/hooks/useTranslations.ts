'use client';

import { useLocale } from '@/contexts/LocaleContext';

export function useTranslations(namespace?: string) {
  const { messages, isLoading } = useLocale();

  const t = (key: string, params?: Record<string, string | number>) => {
    // If still loading, return a loading placeholder
    if (isLoading) {
      return '...';
    }

    const fullKey = namespace ? `${namespace}.${key}` : key;
    const keys = fullKey.split('.');
    
    let value: any = messages;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${fullKey}`);
        return fullKey; // Return the key as fallback
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${fullKey}`);
      return fullKey;
    }

    // Simple parameter replacement
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  return t;
}
