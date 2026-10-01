// Shared metadata utilities for Open Graph, Twitter Cards and JSON-LD.
//
// Every dynamic page (property, trip, guide, restaurant, rental, profile,
// AI trip) should call generateSafarMetadata() from its server-level
// generateMetadata() so social scrapers (WhatsApp, Facebook, X, LinkedIn,
// Telegram, iMessage) see fully-populated Open Graph + Twitter Card tags,
// and Google Search sees a dynamic <title>, meta description and canonical.
//
// For structured data, use the buildJsonLd* helpers to emit inline <script
// type="application/ld+json"> tags matching the entity kind.

const SITE_NAME = 'Safar Curated';
const SITE_HANDLE = '@SafarKashmir';
const DEFAULT_DESCRIPTION = 'Discover curated stays, experiences, guides, and rentals across Kashmir';
// Next.js file-convention `app/opengraph-image.js` auto-serves at this
// path (dynamic PNG, 1200x630). Guaranteed HTTP 200 — unlike the previous
// /og-default.jpg which never existed and made WhatsApp scrapers drop the
// preview image entirely. Note: Next.js serves the file-convention route
// at `/opengraph-image` (extensionless), NOT `/opengraph-image.png`.
const DEFAULT_OG_IMAGE = '/opengraph-image';

export function getBaseUrl() {
  const raw = (process.env.NEXT_PUBLIC_BASE_URL || 'https://safarcurated.com').replace(/\/$/, '');
  // Force HTTPS — social scrapers (WhatsApp especially) reject http:// og:image URLs.
  return raw.startsWith('http://') ? raw.replace(/^http:\/\//, 'https://') : raw;
}

// Truncate a description to a search-friendly length (~155 chars) without
// cutting words in half — matches what Google displays in SERPs.
export function truncateDescription(text, max = 155) {
  if (!text) return DEFAULT_DESCRIPTION;
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?-]$/, '') + '…';
}

// Resolve an image URL to an ABSOLUTE HTTPS URL. Social scrapers (WhatsApp,
// Facebook, LinkedIn, X, Telegram) require og:image to be a fully-qualified
// public URL. Rules:
//   1. Empty/undefined → default OG image on our domain.
//   2. `//host/...`   → prefix with `https:`
//   3. `http://...`   → rewrite to `https://` (WhatsApp drops http images).
//   4. Relative `/x`  → prefix with our base URL (https).
//   5. Absolute https → passthrough.
export function absoluteImageUrl(image) {
  const base = getBaseUrl();
  if (!image || typeof image !== 'string' || !image.trim()) {
    return `${base}${DEFAULT_OG_IMAGE}`;
  }
  const s = image.trim();
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://'))  return 'https://' + s.slice('http://'.length);
  if (s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${base}${s}`;
  return `${base}/${s}`;
}

// Best-guess MIME type for og:image:type. WhatsApp is strict — it silently
// drops previews when og:image:type is missing or wrong.
function guessImageType(url) {
  const s = (url || '').toLowerCase();
  // Our dynamic Next.js ImageResponse routes serve PNG but have no extension.
  if (s.endsWith('/opengraph-image') || s.includes('/opengraph-image?')) return 'image/png';
  if (s.endsWith('/apple-icon')     || s.includes('/apple-icon?'))     return 'image/png';
  if (s.endsWith('/icon')           || s.includes('/icon?'))           return 'image/png';
  if (s.endsWith('.png')  || s.includes('.png?')  || s.includes('format=png'))  return 'image/png';
  if (s.endsWith('.webp') || s.includes('.webp?')) return 'image/webp';
  if (s.endsWith('.gif')  || s.includes('.gif?'))  return 'image/gif';
  return 'image/jpeg';
}

// Generic metadata factory. All dynamic pages should call this from their
// `generateMetadata` export so every page gets consistent OG/Twitter tags.
export function generateSafarMetadata({
  title,
  description,
  image,
  images,        // optional array of images (first is primary)
  url,
  type = 'website',
  keywords,
  price,
  currency = 'INR',
  location,
  publishedTime,
  modifiedTime,
  authors,
  noIndex = false,
}) {
  const baseUrl = getBaseUrl();
  const fullUrl = url ? `${baseUrl}${url.startsWith('/') ? url : `/${url}`}` : baseUrl;
  const cleanDescription = truncateDescription(description);

  // Resolve to absolute HTTPS. IMPORTANT: if the caller did not pass an
  // image at all, we return `null` for the OG images array — this lets the
  // Next.js file-convention `opengraph-image.js` co-located next to the
  // page take over and inject the CORRECT per-route og:image (e.g.
  // `/property/l2/opengraph-image` returns a real 145 KB 1200x630 PNG,
  // whereas hard-coding the site-wide fallback here would emit a competing
  // og:image tag and prevent the per-page image from winning).
  const explicitInputs = (images && images.length ? images : [image]).filter(Boolean);
  const resolvedImages = explicitInputs.length ? explicitInputs.map(absoluteImageUrl) : null;

  // Explicit width/height/type on every OG image — WhatsApp / Facebook drop
  // the preview when these are missing. 1200x630 is the canonical spec.
  const ogImages = resolvedImages
    ? resolvedImages.map((u) => ({
        url: u,
        secureUrl: u,
        width: 1200,
        height: 630,
        type: guessImageType(u),
        alt: title || SITE_NAME,
      }))
    : undefined;

  return {
    title: title || undefined,
    description: cleanDescription,
    keywords: Array.isArray(keywords) ? keywords : undefined,
    alternates: { canonical: fullUrl },
    openGraph: {
      title: title || SITE_NAME,
      description: cleanDescription,
      url: fullUrl,
      siteName: SITE_NAME,
      // Only include `images` when the caller provided one — otherwise the
      // Next.js file-convention `opengraph-image.js` co-located with the
      // page auto-injects the canonical og:image tags. Emitting an empty
      // `images: undefined` key here would suppress that auto-injection.
      ...(ogImages && { images: ogImages }),
      locale: 'en_US',
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(authors && { authors }),
    },
    twitter: {
      card: 'summary_large_image',
      title: title || SITE_NAME,
      description: cleanDescription,
      site: SITE_HANDLE,
      creator: SITE_HANDLE,
      ...(resolvedImages && { images: resolvedImages }),
    },
    ...(noIndex && {
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    }),
    ...(location && {
      other: {
        'og:locality': location,
        'og:region': 'Kashmir',
        'og:country-name': 'India',
        ...(price !== undefined && { 'product:price:amount': String(price) }),
        ...(price !== undefined && { 'product:price:currency': currency }),
      },
    }),
  };
}

// -----------------------------------------------------------------------------
// JSON-LD builders — each returns a plain object safe to JSON.stringify into
// an inline <script type="application/ld+json"> tag. Google, Bing and rich
// social cards all consume these.
// -----------------------------------------------------------------------------

export function buildBreadcrumbJsonLd(items) {
  // items: [{ name, url }]
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: (items || []).map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: /^https?:\/\//i.test(it.url) ? it.url : `${baseUrl}${it.url}`,
    })),
  };
}

export function buildLodgingJsonLd({ id, name, description, images, location, price, currency = 'INR', rating, reviewCount, hostName, url }) {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': `${baseUrl}${url || `/property/${id}`}`,
    name,
    description: truncateDescription(description, 300),
    image: (images || []).map(absoluteImageUrl),
    url: `${baseUrl}${url || `/property/${id}`}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: location || 'Kashmir',
      addressRegion: 'Kashmir',
      addressCountry: 'IN',
    },
    ...(price !== undefined && {
      priceRange: `${currency} ${price}`,
      offers: {
        '@type': 'Offer',
        price: String(price),
        priceCurrency: currency,
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}${url || `/property/${id}`}`,
      },
    }),
    ...(rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(rating),
        reviewCount: String(reviewCount || 1),
        bestRating: '5',
        worstRating: '1',
      },
    }),
    ...(hostName && {
      brand: { '@type': 'Brand', name: hostName },
    }),
  };
}

export function buildProductJsonLd({ id, name, description, images, price, currency = 'INR', rating, reviewCount, url, category }) {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${baseUrl}${url || `/marketplace/${id}`}`,
    name,
    description: truncateDescription(description, 300),
    image: (images || []).map(absoluteImageUrl),
    url: `${baseUrl}${url || `/marketplace/${id}`}`,
    ...(category && { category }),
    ...(price !== undefined && {
      offers: {
        '@type': 'Offer',
        price: String(price),
        priceCurrency: currency,
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}${url || `/marketplace/${id}`}`,
      },
    }),
    ...(rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(rating),
        reviewCount: String(reviewCount || 1),
        bestRating: '5',
        worstRating: '1',
      },
    }),
  };
}

export function buildTouristTripJsonLd({ id, name, description, images, itineraryDays, price, currency = 'INR', url }) {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    '@id': `${baseUrl}${url || `/trip/${id}`}`,
    name,
    description: truncateDescription(description, 300),
    image: (images || []).map(absoluteImageUrl),
    url: `${baseUrl}${url || `/trip/${id}`}`,
    touristType: 'Leisure',
    itinerary: (itineraryDays || []).map((d, idx) => ({
      '@type': 'TouristAttraction',
      name: d.title || `Day ${idx + 1}`,
      description: d.description || '',
    })),
    ...(price !== undefined && {
      offers: {
        '@type': 'Offer',
        price: String(price),
        priceCurrency: currency,
        availability: 'https://schema.org/InStock',
      },
    }),
  };
}

export function buildTouristDestinationJsonLd({ name, description, images, url }) {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name,
    description: truncateDescription(description, 300),
    image: (images || []).map(absoluteImageUrl),
    url: url ? `${baseUrl}${url}` : baseUrl,
    touristType: 'Leisure',
    address: {
      '@type': 'PostalAddress',
      addressLocality: name || 'Kashmir',
      addressRegion: 'Kashmir',
      addressCountry: 'IN',
    },
  };
}

export function buildPersonJsonLd({ id, name, description, image, role, url, sameAs }) {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${baseUrl}${url || `/u/${id}`}`,
    name,
    description: truncateDescription(description, 300),
    ...(image && { image: absoluteImageUrl(image) }),
    ...(role && { jobTitle: role }),
    url: `${baseUrl}${url || `/u/${id}`}`,
    ...(sameAs && sameAs.length && { sameAs }),
    worksFor: { '@id': `${baseUrl}#organization` },
  };
}
