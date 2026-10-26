'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  GCC_COUNTRIES,
  SUPPORTED_CURRENCIES,
  getCountryDefaults,
  getLocaleDirection,
  normalizeLocale,
} from '@/lib/localization';

const STORAGE_KEY = 'safaros.regional-preferences.v1';
const DEFAULTS = { countryCode: 'AE', locale: 'en', currency: 'AED', timeZone: 'Asia/Dubai' };
const LocalizationContext = createContext(null);

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) throw new Error('useLocalization must be used inside LocalizationProvider');
  return context;
}

export function LocalizationProvider({ children }) {
  const [preferences, setPreferences] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        const countryCode = GCC_COUNTRIES[saved.countryCode] ? saved.countryCode : DEFAULTS.countryCode;
        const defaults = getCountryDefaults(countryCode) || DEFAULTS;
        const currency = SUPPORTED_CURRENCIES.includes(saved.currency) ? saved.currency : defaults.currency;
        setPreferences({
          countryCode,
          locale: normalizeLocale(saved.locale),
          currency,
          timeZone: typeof saved.timeZone === 'string' ? saved.timeZone : defaults.timeZone,
        });
      }
    } catch {
      // Storage may be unavailable in private browsing; in-memory defaults still work.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const direction = getLocaleDirection(preferences.locale);
    document.documentElement.lang = preferences.locale;
    document.documentElement.dir = direction;
    document.documentElement.dataset.locale = preferences.locale;
    document.documentElement.dataset.currency = preferences.currency;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Preferences remain active for this page session if storage is unavailable.
    }
  }, [preferences, ready]);

  const updatePreferences = useCallback((patch) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      if (patch.countryCode && GCC_COUNTRIES[patch.countryCode]) {
        const defaults = getCountryDefaults(patch.countryCode);
        // Selecting a country proposes defaults. Explicit locale/currency values in
        // the same patch take precedence so users can override them.
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

  return (
    <LocalizationContext.Provider value={value}>
      {children}
      <div className="safaros-locale-control" dir="ltr">
        <button
          type="button"
          className="safaros-locale-trigger"
          aria-expanded={open}
          aria-controls="safaros-locale-panel"
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">◎</span> Language &amp; region
        </button>
        {open && (
          <section id="safaros-locale-panel" className="safaros-locale-panel" aria-label="Language and regional preferences">
            <div className="safaros-locale-heading">Language &amp; region</div>
            <label>
              Country
              <select value={preferences.countryCode} onChange={(event) => updatePreferences({ countryCode: event.target.value })}>
                {Object.values(GCC_COUNTRIES).map((country) => (
                  <option key={country.code} value={country.code}>{country.name}</option>
                ))}
              </select>
            </label>
            <label>
              Display language
              <select value={preferences.locale} onChange={(event) => updatePreferences({ locale: event.target.value })}>
                <option value="en">English</option>
                <option value="ar">العربية (Arabic)</option>
              </select>
            </label>
            <label>
              Display currency
              <select value={preferences.currency} onChange={(event) => updatePreferences({ currency: event.target.value })}>
                {SUPPORTED_CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </label>
            <p className="safaros-locale-note">These preferences currently apply to this browser. Currency selection changes display preferences only; it does not convert saved financial records.</p>
            <button type="button" className="safaros-locale-done" onClick={() => setOpen(false)}>Done</button>
          </section>
        )}
      </div>
    </LocalizationContext.Provider>
  );
}
