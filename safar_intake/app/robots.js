/**
 * /robots.txt — served at /robots.txt via Next.js file-based convention.
 * Allows crawlers on public marketing/discover surfaces, disallows dashboards,
 * admin, auth and per-user pages.
 */
export default function robots() {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || 'https://safarcurated.com').replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/explore',
          '/property/',
          '/guides',
          '/about',
          '/contact',
          '/privacy',
          '/terms',
        ],
        disallow: [
          '/api/',
          '/admin',
          '/admin/',
          '/auth',
          '/auth/',
          '/dashboard',
          '/dashboard/',
          '/notifications',
          '/wishlist',
          '/review',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
