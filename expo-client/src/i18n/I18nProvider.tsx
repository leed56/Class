import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getCurrentUserLanguage } from '@/features/auth/authService';
import { isLocale, LOCALE_STORAGE_KEY, resolveTranslation, translations } from '@/i18n';
import { Locale } from '@/i18n/types';

type I18nContextValue = {
  locale: Locale;
  ready: boolean;
  setLocale: (next: Locale) => Promise<void>;
  t: (path: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        if (isLocale(stored)) {
          if (!cancelled) setLocaleState(stored);
          return;
        }

        const workspaceLanguage = await getCurrentUserLanguage().catch(() => 'en' as Locale);
        if (!cancelled && isLocale(workspaceLanguage)) {
          setLocaleState(workspaceLanguage);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (path: string) => resolveTranslation(translations[locale], path),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      ready,
      setLocale,
      t,
    }),
    [locale, ready, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
