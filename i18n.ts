// Can be imported from a shared config
export const locales = ['tr', 'en', 'es', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'tr';
