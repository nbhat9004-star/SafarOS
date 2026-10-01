// PWA manifest — Next.js file convention. Automatically served at /manifest.webmanifest
// and referenced via <link rel="manifest"> injected by the framework.
export default function manifest() {
  return {
    id: '/',
    name: 'Safar Curated — Kashmir',
    short_name: 'Safar',
    description: 'Discover curated stays, experiences, guides, and rentals across Kashmir.',
    start_url: '/?source=pwa',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    // NOTE: Android/Chrome auto-generates the native PWA splash from the
    // manifest — it can only render a SOLID background_color + centered icon
    // (no photographic background is supported by the platform). We set this to
    // match the in-app Kashmir launch screen's base color (see .pwa-splash in
    // globals.css) so the native splash flows seamlessly into the full-screen
    // Kashmir screen with zero color flash. theme_color stays deep-emerald brand.
    background_color: '#0A2C21',
    theme_color: '#0F3D2E',
    orientation: 'portrait',
    scope: '/',
    lang: 'en',
    categories: ['travel', 'lifestyle', 'business'],
    shortcuts: [
      { name: 'Explore Kashmir', short_name: 'Explore', url: '/explore', description: 'Browse stays & experiences' },
      { name: 'My Trips',        short_name: 'Trips',   url: '/dashboard/traveler/bookings', description: 'View your bookings' },
      { name: 'Saved',           short_name: 'Saved',   url: '/wishlist', description: 'Your saved listings' },
    ],
    icons: [
      { src: '/icon.svg',       sizes: 'any',       type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon.svg', sizes: '180x180',   type: 'image/svg+xml', purpose: 'any maskable' },
      { src: '/icon',           sizes: '32x32',     type: 'image/png' },
      { src: '/icon',           sizes: '192x192',   type: 'image/png' },
      { src: '/icon',           sizes: '512x512',   type: 'image/png', purpose: 'any maskable' },
    ],
  };
}
