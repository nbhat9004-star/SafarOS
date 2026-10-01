// Server component wrapper for /property/[id]. This gives every listing
// page a real, per-listing <title>, meta description, canonical URL, Open
// Graph tags, Twitter Card tags AND a LodgingBusiness + BreadcrumbList
// JSON-LD block that social scrapers and Google can read WITHOUT executing
// JavaScript. The interactive UI lives in PropertyClient.jsx (client comp).
import PropertyClient from './PropertyClient';
import { getCollection } from '@/lib/db';
import {
  generateSafarMetadata,
  buildLodgingJsonLd,
  buildBreadcrumbJsonLd,
  getBaseUrl,
} from '@/lib/metadata';

// Fetch the listing directly from MongoDB — cheaper than an internal HTTP hop.
async function loadListing(id) {
  try {
    const col = await getCollection('listings');
    const doc = await col.findOne({ id, status: 'approved' }, { projection: { _id: 0 } });
    return doc || null;
  } catch (e) {
    console.error('property/[id]: failed to load listing for metadata', e);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await Promise.resolve(params);
  const listing = await loadListing(id);
  if (!listing) {
    // Note: we deliberately do NOT set `image` here. The co-located
    // `opengraph-image.js` handles the null-listing case internally by
    // rendering a branded fallback, and Next.js file convention auto-emits
    // the og:image tag pointing at the correct URL with correct dimensions.
    return generateSafarMetadata({
      title: 'Listing not found',
      description: 'This listing is no longer available.',
      url: `/property/${id}`,
      noIndex: true,
    });
  }

  const hostName = listing.hostName || listing.host?.name;
  const location = listing.location || 'Kashmir';
  const rawTitle = listing.title || 'Kashmir Stay';
  const title = rawTitle;
  const description = listing.description
    ? listing.description
    : hostName
      ? `Stay at ${rawTitle} hosted by ${hostName} in ${location}. Curated by Safar.`
      : `Discover ${rawTitle} in ${location} — curated by Safar Curated.`;

  // NOTE: we intentionally do NOT pass `image`/`images` here. The co-located
  // `app/property/[id]/opengraph-image.js` file-convention route auto-injects
  // the canonical `<meta property="og:image">` (plus width/height/type) at
  // build time — a real 1200x630 PNG sized under WhatsApp's ~1 MB ceiling.
  // Passing images here would emit a SECOND og:image tag pointing at the raw
  // multi-megabyte Unsplash source, which WhatsApp silently rejects.
  return generateSafarMetadata({
    title,
    description,
    url: `/property/${listing.id}`,
    type: 'website',
    location,
    price: listing.price,
    keywords: [
      rawTitle,
      location,
      listing.category,
      listing.subcategory,
      'Kashmir',
      'Safar Curated',
    ].filter(Boolean),
  });
}

export default async function PropertyPage({ params }) {
  const { id } = await Promise.resolve(params);
  const listing = await loadListing(id);

  const baseUrl = getBaseUrl();
  const jsonLdGraphs = [];

  if (listing) {
    jsonLdGraphs.push(
      buildLodgingJsonLd({
        id: listing.id,
        name: listing.title,
        description: listing.description,
        images: Array.isArray(listing.images) ? listing.images : [],
        location: listing.location,
        price: listing.price,
        rating: listing.rating,
        reviewCount: listing.reviewCount,
        hostName: listing.hostName || listing.host?.name,
        url: `/property/${listing.id}`,
      }),
      buildBreadcrumbJsonLd([
        { name: 'Home',       url: '/' },
        { name: 'Marketplace', url: '/marketplace' },
        ...(listing.category ? [{ name: listing.category, url: `/explore?cat=${listing.category}` }] : []),
        { name: listing.title || 'Listing', url: `/property/${listing.id}` },
      ]),
    );
  }

  return (
    <>
      {/* JSON-LD: emitted server-side so Google + social scrapers see it
          without JavaScript. Placed at the top so it's in the initial HTML. */}
      {jsonLdGraphs.map((graph, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
        />
      ))}
      <PropertyClient />
    </>
  );
}
