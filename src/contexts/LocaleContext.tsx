import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { type Locale, LOCALES, TRANSLATIONS } from '../i18n/locales';

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const Ctx = createContext<LocaleCtx | null>(null);

const STORAGE_KEY = 'mpaye_superadmin:locale';

function detectInitial(): Locale {
  if (typeof window === 'undefined') return 'fr';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && LOCALES.some((l) => l.code === stored)) {
    return stored as Locale;
  }
  const nav = navigator.language?.slice(0, 2).toLowerCase();
  if (nav === 'en') return 'en';
  if (nav === 'mg') return 'mg';
  return 'fr';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = TRANSLATIONS[locale] ?? TRANSLATIONS.fr;
      let value = dict[key] ?? TRANSLATIONS.fr[key] ?? key;
      if (params) {
        for (const [p, v] of Object.entries(params)) {
          value = value.replace(`{${p}}`, String(v));
        }
      }
      return value;
    },
    [locale],
  );

  const ctx = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function useLocale() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

export function useT() {
  return useLocale().t;
}
