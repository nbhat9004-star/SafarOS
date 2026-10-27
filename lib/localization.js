/**
 * SafarOS global localisation foundation.
 *
 * Keep country defaults, UI language, and accounting currency separate:
 * - countryCode selects suggested regional defaults;
 * - locale controls language/formatting and text direction;
 * - currency controls money formatting only.
 *
 * Do not use these display helpers to convert or rewrite stored financial values.
 */

export const SUPPORTED_LOCALES = Object.freeze(['en', 'ar']);

export const GCC_COUNTRIES = Object.freeze({
  AE: Object.freeze({
    code: 'AE',
    name: 'United Arab Emirates',
    defaultLocale: 'en',
    supportedLocales: ['en', 'ar'],
    currency: 'AED',
    timeZone: 'Asia/Dubai',
    phoneCallingCode: '+971',
  }),
  SA: Object.freeze({
    code: 'SA',
    name: 'Saudi Arabia',
    defaultLocale: 'ar',
    supportedLocales: ['ar', 'en'],
    currency: 'SAR',
    timeZone: 'Asia/Riyadh',
    phoneCallingCode: '+966',
  }),
  QA: Object.freeze({
    code: 'QA',
    name: 'Qatar',
    defaultLocale: 'ar',
    supportedLocales: ['ar', 'en'],
    currency: 'QAR',
    timeZone: 'Asia/Qatar',
    phoneCallingCode: '+974',
  }),
  KW: Object.freeze({
    code: 'KW',
    name: 'Kuwait',
    defaultLocale: 'ar',
    supportedLocales: ['ar', 'en'],
    currency: 'KWD',
    timeZone: 'Asia/Kuwait',
    phoneCallingCode: '+965',
  }),
  BH: Object.freeze({
    code: 'BH',
    name: 'Bahrain',
    defaultLocale: 'ar',
    supportedLocales: ['ar', 'en'],
    currency: 'BHD',
    timeZone: 'Asia/Bahrain',
    phoneCallingCode: '+973',
  }),
  OM: Object.freeze({
    code: 'OM',
    name: 'Oman',
    defaultLocale: 'ar',
    supportedLocales: ['ar', 'en'],
    currency: 'OMR',
    timeZone: 'Asia/Muscat',
    phoneCallingCode: '+968',
  }),
});

export const SUPPORTED_CURRENCIES = Object.freeze([
  'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'NZD', 'JPY', 'CNY', 'HKD', 'SGD', 'MYR', 'IDR', 'THB', 'PHP', 'PKR', 'BDT', 'LKR', 'TRY', 'ZAR', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'BRL', 'MXN', 'KRW',
]);

export const LOCALE_DIRECTIONS = Object.freeze({
  en: 'ltr',
  ar: 'rtl',
});

export const UI_MESSAGES = Object.freeze({
  en: Object.freeze({
    language: 'Language',
    country: 'Country',
    currency: 'Currency',
    english: 'English',
    arabic: 'Arabic',
    save: 'Save changes',
    cancel: 'Cancel',
    settings: 'Settings',
  }),
  ar: Object.freeze({
    language: 'اللغة',
    country: 'الدولة',
    currency: 'العملة',
    english: 'الإنجليزية',
    arabic: 'العربية',
    save: 'حفظ التغييرات',
    cancel: 'إلغاء',
    settings: 'الإعدادات',
  }),
});

export function normalizeLocale(locale) {
  const base = String(locale || 'en').trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.includes(base) ? base : 'en';
}

export function getLocaleDirection(locale) {
  return normalizeLocale(locale) === 'ar' ? 'rtl' : 'ltr';
}

export function getCountryConfig(countryCode) {
  const code = String(countryCode || '').trim().toUpperCase();
  return GCC_COUNTRIES[code] || null;
}

export function getCountryDefaults(countryCode) {
  const country = getCountryConfig(countryCode);
  if (!country) return null;
  return {
    countryCode: country.code,
    locale: country.defaultLocale,
    currency: country.currency,
    timeZone: country.timeZone,
    phoneCallingCode: country.phoneCallingCode,
  };
}

/**
 * Format a numeric amount for display without converting its value.
 * Financial records should store amount and ISO currency code separately.
 */
export function formatCurrency(amount, currency = 'USD', locale = 'en') {
  const numericAmount = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(numericAmount)) return '';

  const normalizedCurrency = String(currency || 'USD').trim().toUpperCase();
  try {
    return new Intl.NumberFormat(normalizeLocale(locale), {
      style: 'currency',
      currency: normalizedCurrency,
      currencyDisplay: 'symbol',
    }).format(numericAmount);
  } catch {
    // Fail visibly and predictably for invalid currency codes; never guess a conversion.
    return `${numericAmount.toLocaleString(normalizeLocale(locale))} ${normalizedCurrency}`;
  }
}

export function getUiMessages(locale) {
  return UI_MESSAGES[normalizeLocale(locale)];
}
