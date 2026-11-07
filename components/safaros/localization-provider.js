'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  COUNTRIES_BY_CODE,
  SUPPORTED_CURRENCIES,
  getCountryDefaults,
  getLocaleDirection,
  normalizeLocale,
} from '@/lib/localization';

const STORAGE_KEY = 'safaros.regional-preferences.v1';
const DEFAULTS = { countryCode: 'IN', locale: 'en', currency: 'INR', timeZone: 'Asia/Kolkata' };
const LocalizationContext = createContext(null);

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) throw new Error('useLocalization must be used inside LocalizationProvider');
  return context;
}

export function LocalizationProvider({ children }) {
  const [preferences, setPreferences] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        const countryCode = COUNTRIES_BY_CODE[saved.countryCode] ? saved.countryCode : DEFAULTS.countryCode;
        const defaults = getCountryDefaults(countryCode) || DEFAULTS;
        const currency = SUPPORTED_CURRENCIES.includes(saved.currency) ? saved.currency : defaults.currency;
        setPreferences({
          countryCode,
          locale: normalizeLocale(saved.locale || defaults.locale),
          currency,
          timeZone: typeof saved.timeZone === 'string' ? saved.timeZone : defaults.timeZone,
        });
      } else {
        const match = document.cookie.split('; ').find((part) => part.startsWith('safaros.auto-region='));
        if (match) {
          try {
            const detected = JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
            const detectedCountry = COUNTRIES_BY_CODE[detected.countryCode] ? detected.countryCode : DEFAULTS.countryCode;
            const defaults = getCountryDefaults(detectedCountry) || DEFAULTS;
            setPreferences({
              countryCode: detectedCountry,
              locale: normalizeLocale(detected.locale || defaults.locale),
              currency: SUPPORTED_CURRENCIES.includes(detected.currency) ? detected.currency : defaults.currency,
              timeZone: defaults.timeZone,
            });
          } catch { /* Invalid edge cookie: use the global default. */ }
        } else {
          const browserRegion = (navigator.language || 'en-IN').split('-')[1]?.toUpperCase();
          const detectedCountry = COUNTRIES_BY_CODE[browserRegion] ? browserRegion : DEFAULTS.countryCode;
          const defaults = getCountryDefaults(detectedCountry) || DEFAULTS;
          setPreferences({ ...DEFAULTS, countryCode: detectedCountry, currency: defaults.currency, timeZone: defaults.timeZone, locale: normalizeLocale(navigator.language) });
        }
      }
    } catch { /* Storage may be unavailable; in-memory defaults still work. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = preferences.locale;
    document.documentElement.dir = getLocaleDirection(preferences.locale);
    document.documentElement.dataset.locale = preferences.locale;
    document.documentElement.dataset.currency = preferences.currency;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); }
    catch { /* Keep preferences active in memory for this session. */ }
  }, [preferences, ready]);

  const updatePreferences = useCallback((patch) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      if (patch.countryCode && COUNTRIES_BY_CODE[patch.countryCode]) {
        const defaults = getCountryDefaults(patch.countryCode);
        if (patch.locale === undefined) next.locale = defaults.locale;
        if (patch.currency === undefined) next.currency = defaults.currency;
        if (patch.timeZone === undefined) next.timeZone = defaults.timeZone;
      }
      next.locale = normalizeLocale(next.locale);
      if (!SUPPORTED_CURRENCIES.includes(next.currency)) next.currency = DEFAULTS.currency;
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    ...preferences,
    ready,
    direction: getLocaleDirection(preferences.locale),
    updatePreferences,
  }), [preferences, ready, updatePreferences]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}
