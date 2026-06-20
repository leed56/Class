import { en } from '@/i18n/locales/en';
import { si } from '@/i18n/locales/si';
import { ta } from '@/i18n/locales/ta';
import { Locale, TranslationTree } from '@/i18n/types';

export const LOCALE_STORAGE_KEY = 'classflow:locale';

export const translations: Record<Locale, TranslationTree> = {
  en,
  si,
  ta,
};

export function resolveTranslation(tree: TranslationTree, path: string): string {
  const parts = path.split('.');
  let current: unknown = tree;

  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return path;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : path;
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'si' || value === 'ta';
}
