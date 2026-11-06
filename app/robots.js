import { SITE_URL } from '@/lib/site-url';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/dashboard/',
        '/portal/',
        '/login',
        '/signup',
        '/reset-password',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
