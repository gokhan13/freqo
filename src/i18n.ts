export type Locale = 'tr' | 'en';
export type Text = { tr: string; en: string };
export const tx = (value: Text, locale: Locale) => value[locale];
export const text = (tr: string, en: string): Text => ({ tr, en });
