import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/lib/auth-context';
import PWALayer from '@/components/safar/PWALayer';

// PERF: Only load the Inter weights actually used in the UI (body uses 400, UI accents use 500/600/700).
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

// PERF: Reduced Poppins from 5 weights (400/500/600/700/800) to 3 (500/600/700).
// Codebase audit: 0 uses of font-extrabold (800) on display headings; 3 of font-normal (400 - handled by Inter body).
// PERF: `preload: false` on Poppins — the 47 KB Poppins-500 file was on the
// critical preload chain (see HAR analysis) but Poppins is only used for
// display headings (`.font-display`). Inter (already preloaded) handles all
// body/UI text and hero H1 fallback via `font-display: swap`. Removing the
// Poppins preload strips ~47 KB from the critical path and improves FCP by
// ~150–250 ms on mobile without any visual regression (headings still render
// in Poppins as soon as the font arrives).
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
  preload: false,
});

export const metadata = {
  title: {
    default: 'Safar Curated — Experience Kashmir Like a Local',
    template: '%s | Safar Curated',
  },
  description: 'Book authentic Kashmir stays, houseboats, cabins, transport and AI-planned itineraries. Premium tourism marketplace for Kashmir, India.',
  keywords: ['Kashmir tourism','Srinagar houseboats','Gulmarg cabins','Pahalgam cottages','AI trip planner','Safar Curated','Kashmir travel','Dal Lake stay'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://safarcurated.com'),
  applicationName: 'Safar Curated',
  authors: [{ name: 'Safar Curated' }],
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  creator: 'Safar Curated',
  publisher: 'Safar Curated',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: '/',
  },
  // Icons — Next.js also auto-injects <link> tags from app/icon.svg,
  // app/apple-icon.svg, and app/icon.js (dynamic PNG). Listing them
  // explicitly ensures search engines/social scrapers see every size.
  icons: {
    icon: [
      { url: '/icon.svg',  type: 'image/svg+xml' },
      { url: '/icon',      sizes: '32x32',   type: 'image/png' },
      { url: '/icon',      sizes: '192x192', type: 'image/png' },
      { url: '/icon',      sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'Safar Curated — Experience Kashmir Like a Local',
    description: 'Discover curated stays, experiences, guides, and rentals across Kashmir',
    url: '/',
    siteName: 'Safar Curated',
    images: [
      {
        url: '/opengraph-image',
        secureUrl: '/opengraph-image',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'Safar Curated Kashmir — Curated Travel Experiences',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Safar Curated — Experience Kashmir Like a Local',
    description: 'Discover curated stays, experiences, guides, and rentals across Kashmir',
    creator: '@SafarKashmir',
    site: '@SafarKashmir',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'travel',
};

export const viewport = {
  themeColor: '#0F3D2E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://safarcurated.com';

  // Structured data — Organization + WebSite. Rendered inline in the root
  // layout so it appears on every page for Google's Knowledge Graph and
  // sitelinks search box. Kept as an @graph array so both entities share
  // one <script> tag without conflicting @type definitions.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}#organization`,
        name: 'Safar Curated',
        alternateName: 'Safar',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/icon.svg`,
          width: 512,
          height: 512,
        },
        description: 'Curated tourism marketplace for Kashmir — stays, experiences, guides, transport and AI-planned itineraries.',
        sameAs: [
          'https://instagram.com/safarcurated',
          'https://facebook.com/safarcurated',
          'https://twitter.com/safarcurated',
          'https://linkedin.com/company/safarcurated',
        ],
        contactPoint: [{
          '@type': 'ContactPoint',
          email: 'hello@safarcurated.com',
          contactType: 'customer support',
          areaServed: 'IN',
          availableLanguage: ['English', 'Hindi', 'Urdu'],
        }],
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Srinagar',
          addressRegion: 'Kashmir',
          addressCountry: 'IN',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}#website`,
        url: baseUrl,
        name: 'Safar Curated',
        description: 'Discover curated stays, experiences, guides, and rentals across Kashmir',
        publisher: { '@id': `${baseUrl}#organization` },
        inLanguage: 'en-US',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/explore?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        {/* iOS installed-PWA behavior: run standalone, translucent dark status
            bar over the forest-green splash. Android uses the manifest. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Safar" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://images.pexels.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.pexels.com" />
        {/* Razorpay checkout script — DNS-prefetch keeps first-paint fast; the script itself is lazy-loaded only when the user opens the payment sheet. */}
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
        <link rel="dns-prefetch" href="https://api.razorpay.com" />
        <link rel="dns-prefetch" href="https://api.dicebear.com" />
        {/* Global Organization + WebSite JSON-LD — powers Google Knowledge
            Panel, sitelinks searchbox and social rich cards. */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
        <PWALayer />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
