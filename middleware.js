import { NextResponse } from 'next/server';

const COUNTRY_CURRENCY = {
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR',
  IN: 'INR', US: 'USD', CA: 'CAD', GB: 'GBP', IE: 'EUR', DE: 'EUR',
  FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR',
  PT: 'EUR', FI: 'EUR', GR: 'EUR', AU: 'AUD', NZ: 'NZD', JP: 'JPY',
  CN: 'CNY', HK: 'HKD', SG: 'SGD', MY: 'MYR', ID: 'IDR', TH: 'THB',
  PH: 'PHP', PK: 'PKR', BD: 'BDT', LK: 'LKR', TR: 'TRY', ZA: 'ZAR',
  CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', BR: 'BRL',
  MX: 'MXN', KR: 'KRW',
};

export function middleware(request) {
  const response = NextResponse.next();
  // Vercel supplies this country code at the edge when geolocation is available.
  // Do not overwrite an existing visitor choice; explicit preferences win.
  const existing = request.cookies.get('safaros.regional-preferences.v1')?.value;
  if (!existing) {
    const countryCode = (request.headers.get('x-vercel-ip-country') || '').toUpperCase();
    const acceptLanguage = request.headers.get('accept-language') || '';
    const preferredLanguage = acceptLanguage.toLowerCase().split(',')[0]?.split('-')[0];
    const locale = preferredLanguage === 'ar' ? 'ar' : 'en';
    const currency = COUNTRY_CURRENCY[countryCode] || 'USD';
    const defaults = { countryCode, locale, currency, source: 'auto' };
    response.cookies.set('safaros.auto-region', JSON.stringify(defaults), {
      path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    });
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
