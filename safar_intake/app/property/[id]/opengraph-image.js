import { ImageResponse } from 'next/og';
import { getCollection } from '@/lib/db';

// Per-property dynamic Open Graph image.
//
// WHY THIS EXISTS
// Previously the property page emitted the raw listing image URL (often a
// 4-5 MB Unsplash portrait, e.g. 4480x5600) as og:image. WhatsApp's crawler
// silently drops OG previews when the image exceeds ~1 MB or when the
// declared width/height do not match the actual image. That's why the
// share preview showed only the title and description.
//
// WHAT THIS DOES
// Next.js file convention: any `opengraph-image.js` inside a route folder
// is auto-served at `/<route>/opengraph-image` (extensionless PNG) AND
// auto-injected into that page's <meta property="og:image"> tags at build
// time — including correct og:image:width, og:image:height and og:image:type.
// We render a fixed 1200x630 PNG (~150-400 KB) using ImageResponse:
//   * Fetches the listing's primary image server-side.
//   * Force-shrinks the source via imgix params when the CDN supports it
//     so the composited image stays small.
//   * Falls back to a branded gradient if no image is available.
//   * Overlays the property title + Safar branding.
//
// Result: every WhatsApp / Facebook / LinkedIn / Telegram / X share of a
// property URL gets a real, small, correctly-sized preview image.
export const runtime = 'nodejs';
export const contentType = 'image/png';
export const alt = 'Safar Curated — Kashmir Property';
export const size = { width: 1200, height: 630 };

// Downscale hint appended to known image CDNs — keeps the composited PNG
// small and avoids WhatsApp's file-size ceiling.
function optimizedSourceUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (host.endsWith('images.unsplash.com') || host.endsWith('imgix.net')) {
      u.searchParams.set('w', '1200');
      u.searchParams.set('h', '630');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('fm', 'jpg');
      u.searchParams.set('q', '75');
      u.searchParams.set('auto', 'format');
      return u.toString();
    }
    if (host.endsWith('images.pexels.com')) {
      u.searchParams.set('auto', 'compress');
      u.searchParams.set('cs', 'tinysrgb');
      u.searchParams.set('w', '1200');
      u.searchParams.set('h', '630');
      u.searchParams.set('fit', 'crop');
      return u.toString();
    }
    // Cloudinary
    if (host.endsWith('res.cloudinary.com')) {
      return raw.replace('/upload/', '/upload/w_1200,h_630,c_fill,q_auto,f_auto/');
    }
    return raw;
  } catch {
    return raw;
  }
}

async function loadListing(id) {
  try {
    const col = await getCollection('listings');
    return await col.findOne({ id, status: 'approved' }, { projection: { _id: 0 } });
  } catch {
    return null;
  }
}

export default async function PropertyOpenGraphImage({ params }) {
  const { id } = await Promise.resolve(params);
  const listing = await loadListing(id);

  const candidateImages = listing
    ? [
        ...(Array.isArray(listing.images) ? listing.images : []),
        ...(Array.isArray(listing.gallery) ? listing.gallery : []),
        listing.image,
        listing.coverImage,
        listing.thumbnail,
      ].filter((s) => typeof s === 'string' && s.trim().length > 0)
    : [];

  const bgImage = optimizedSourceUrl(candidateImages[0]);
  const title = (listing?.title || 'Kashmir Stay').slice(0, 90);
  const location = listing?.location || 'Kashmir';
  const price = typeof listing?.price === 'number' ? `₹${listing.price.toLocaleString('en-IN')}` : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          background: 'linear-gradient(135deg, #064E3B 0%, #0F766E 55%, #059669 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {bgImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bgImage}
            alt=""
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        {/* Dark bottom-gradient so the title stays legible over any photo */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.75) 100%)',
            display: 'flex',
          }}
        />

        {/* Top-left brand chip */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '10px 18px 10px 12px',
            background: 'rgba(15, 118, 110, 0.95)',
            borderRadius: 999,
            color: 'white',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C7.58 2 4 5.58 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="#F5C451"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>Safar Curated</div>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>KASHMIR</div>
          </div>
        </div>

        {/* Bottom title + location + price */}
        <div
          style={{
            position: 'absolute',
            left: 48,
            right: 48,
            bottom: 44,
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.85)',
              marginBottom: 14,
            }}
          >
            {location}
          </div>
          <div
            style={{
              fontSize: title.length > 45 ? 56 : 68,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              maxWidth: 1050,
            }}
          >
            {title}
          </div>
          {price && (
            <div
              style={{
                marginTop: 22,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#F5C451',
                  padding: '8px 18px',
                  background: 'rgba(0,0,0,0.45)',
                  borderRadius: 12,
                }}
              >
                From {price} <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 18, fontWeight: 500 }}>/ night</span>
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      // Cache aggressively at the CDN — this image only changes when the
      // listing changes. Vercel Edge respects immutable + long max-age.
      headers: {
        'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
