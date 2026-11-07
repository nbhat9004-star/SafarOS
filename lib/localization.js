/**
 * Global country and currency defaults for SafarOS.
 * Country selection suggests regional defaults; it never converts stored money.
 */
import worldCountries from 'world-countries';

export const SUPPORTED_LOCALES = Object.freeze(['en', 'ar']);
const flagFor = (code) => String(code || '').toUpperCase().replace(/./g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));
const rawCountries = Array.isArray(worldCountries) ? worldCountries : (worldCountries.default || []);
export const COUNTRY_OPTIONS = Object.freeze(rawCountries
  .filter((country) => country.cca2 && country.name?.common)
  .map((country) => {
    const currencies = country.currencies || {};
    const currency = Object.keys(currencies)[0] || 'USD';
    const callingCode = country.idd?.root ? country.idd.root + (country.idd.suffixes?.length === 1 ? country.idd.suffixes[0] : '') : '';
    return Object.freeze({ code: country.cca2, name: country.name.common, flag: country.flag || flagFor(country.cca2), currency, currencyName: currencies[currency]?.name || currency, timeZone: country.timezones?.[0] || 'UTC', phoneCallingCode: callingCode });
  })
  .sort((a, b) => a.name.localeCompare(b.name)));

export const COUNTRIES_BY_CODE = Object.freeze(Object.fromEntries(COUNTRY_OPTIONS.map((country) => [country.code, Object.freeze({
  ...country, defaultLocale: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM'].includes(country.code) ? 'ar' : 'en', supportedLocales: ['en', 'ar'],
})])));
export const GCC_COUNTRIES = COUNTRIES_BY_CODE; // Backward-compatible export; now includes every country.
export const SUPPORTED_CURRENCIES = Object.freeze([...new Set([...COUNTRY_OPTIONS.map((country) => country.currency), 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'USD', 'EUR', 'GBP', 'INR'])].sort());
export const LOCALE_DIRECTIONS = Object.freeze({ en: 'ltr', ar: 'rtl' });
export const UI_MESSAGES = Object.freeze({
  en: Object.freeze({ language: 'Language', country: 'Country', currency: 'Currency', english: 'English', arabic: 'Arabic', save: 'Save changes', cancel: 'Cancel', settings: 'Settings' }),
  ar: Object.freeze({ language: 'اللغة', country: 'الدولة', currency: 'العملة', english: 'الإنجليزية', arabic: 'العربية', save: 'حفظ التغييرات', cancel: 'إلغاء', settings: 'الإعدادات' }),
});
export function normalizeLocale(locale) { const base = String(locale || 'en').trim().toLowerCase().split(/[-_]/)[0]; return SUPPORTED_LOCALES.includes(base) ? base : 'en'; }
export function getLocaleDirection(locale) { return normalizeLocale(locale) === 'ar' ? 'rtl' : 'ltr'; }
export function getCountryConfig(countryCode) { return COUNTRIES_BY_CODE[String(countryCode || '').trim().toUpperCase()] || null; }
export function getCurrencyMetadata(currencyCode, locale = 'en') {
  const currency = String(currencyCode || 'USD').trim().toUpperCase();
  try {
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    const parts = formatter.formatToParts(1234.5);
    const currencyIndex = parts.findIndex((part) => part.type === 'currency');
    const integerIndex = parts.findIndex((part) => part.type === 'integer');
    return { currencyCode: currency, currencySymbol: parts[currencyIndex]?.value || currency, currencyPosition: currencyIndex <= integerIndex ? 'before' : 'after', currencyDecimalPlaces: formatter.resolvedOptions().maximumFractionDigits };
  } catch { return { currencyCode: currency, currencySymbol: currency, currencyPosition: 'after', currencyDecimalPlaces: 2 }; }
}
export function getCountryDefaults(countryCode) {
  const country = getCountryConfig(countryCode);
  if (!country) return null;
  return { countryCode: country.code, country: country.name, locale: country.defaultLocale, currency: country.currency, timeZone: country.timeZone, phoneCallingCode: country.phoneCallingCode, ...getCurrencyMetadata(country.currency, country.defaultLocale) };
}
export function getCountryCodeByName(name) { const value = String(name || '').trim().toLowerCase(); return COUNTRY_OPTIONS.find((country) => country.name.toLowerCase() === value)?.code || ''; }
export function formatCurrency(amount, currency = 'USD', locale = 'en') {
  const numericAmount = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(numericAmount)) return '';
  const normalizedCurrency = String(currency || 'USD').trim().toUpperCase();
  try { return new Intl.NumberFormat(normalizeLocale(locale), { style: 'currency', currency: normalizedCurrency, currencyDisplay: 'symbol' }).format(numericAmount); }
  catch { return `${numericAmount.toLocaleString(normalizeLocale(locale))} ${normalizedCurrency}`; }
}
export function getUiMessages(locale) { return UI_MESSAGES[normalizeLocale(locale)]; }
