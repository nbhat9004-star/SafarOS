/**
 * Country-aware regional defaults for SafarOS.
 * Currency preferences affect display only; stored financial values are never converted.
 */
import { Country, City } from 'country-state-city';
import tzLookup from 'tz-lookup';
export const SUPPORTED_LOCALES = Object.freeze(['en', 'ar']);
export const GCC_COUNTRIES = Object.freeze({
 AE:{code:'AE',name:'United Arab Emirates',defaultLocale:'ar',currency:'AED',timeZone:'Asia/Dubai'},
 SA:{code:'SA',name:'Saudi Arabia',defaultLocale:'ar',currency:'SAR',timeZone:'Asia/Riyadh'},
 QA:{code:'QA',name:'Qatar',defaultLocale:'ar',currency:'QAR',timeZone:'Asia/Qatar'},
 KW:{code:'KW',name:'Kuwait',defaultLocale:'ar',currency:'KWD',timeZone:'Asia/Kuwait'},
 BH:{code:'BH',name:'Bahrain',defaultLocale:'ar',currency:'BHD',timeZone:'Asia/Bahrain'},
 OM:{code:'OM',name:'Oman',defaultLocale:'ar',currency:'OMR',timeZone:'Asia/Muscat'},
});
export const COUNTRIES = Object.freeze(Country.getAllCountries().map(c=>({code:c.isoCode,name:c.name,currency:c.currency||'USD'})).sort((a,b)=>a.name.localeCompare(b.name)));
export const SUPPORTED_CURRENCIES = Object.freeze([...new Set([...COUNTRIES.map(c=>c.currency),'AED','SAR','QAR','KWD','BHD','OMR','USD','EUR','GBP','INR','CAD','AUD','NZD','JPY','CNY','HKD','SGD','MYR','IDR','THB','PHP','PKR','BDT','LKR','TRY','ZAR','CHF','SEK','NOK','DKK','PLN','BRL','MXN','KRW'])].filter(Boolean).sort());
export const LOCALE_DIRECTIONS = Object.freeze({en:'ltr',ar:'rtl'});
export const UI_MESSAGES = Object.freeze({
 en:Object.freeze({language:'Language',country:'Country',currency:'Currency',english:'English',arabic:'Arabic',save:'Save changes',cancel:'Cancel',settings:'Settings'}),
 ar:Object.freeze({language:'اللغة',country:'الدولة',currency:'العملة',english:'الإنجليزية',arabic:'العربية',save:'حفظ التغييرات',cancel:'إلغاء',settings:'الإعدادات'}),
});
export function normalizeLocale(locale){const base=String(locale||'en').trim().toLowerCase().split(/[-_]/)[0];return SUPPORTED_LOCALES.includes(base)?base:'en';}
export function getLocaleDirection(locale){return normalizeLocale(locale)==='ar'?'rtl':'ltr';}
export function getAllCountries(){return COUNTRIES;}
export function getCitiesForCountry(code){return City.getCitiesOfCountry(String(code||'').toUpperCase())||[];}
export function getCountryDefaults(code){
 const cc=String(code||'').trim().toUpperCase();const country=Country.getCountryByCode(cc);if(!country)return null;
 const gcc=GCC_COUNTRIES[cc];const zones=country.timezones||[];
 return {countryCode:cc,country:country.name,locale:gcc?'ar':'en',currency:country.currency||gcc?.currency||'USD',timeZone:gcc?.timeZone||zones[0]?.zoneName||zones[0]?.name||'UTC',phoneCallingCode:country.phonecode?'+'+country.phonecode:''};
}
export function getCityTimezone(city){if(!city||!Number.isFinite(Number(city.latitude))||!Number.isFinite(Number(city.longitude)))return null;try{return tzLookup(Number(city.latitude),Number(city.longitude));}catch{return null;}}
export function formatCurrency(amount,currency='USD',locale='en'){
 const n=typeof amount==='number'?amount:Number(amount);if(!Number.isFinite(n))return '';const code=String(currency||'USD').trim().toUpperCase();
 try{return new Intl.NumberFormat(normalizeLocale(locale),{style:'currency',currency:code,currencyDisplay:'symbol'}).format(n);}catch{return n.toLocaleString(normalizeLocale(locale))+' '+code;}
}
export function getUiMessages(locale){return UI_MESSAGES[normalizeLocale(locale)];}
