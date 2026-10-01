import { ImageResponse } from 'next/og';

// Default Open Graph image — Next.js file convention. Auto-served at
// /opengraph-image.png and auto-injected as <meta property="og:image">
// for any page whose generateMetadata does NOT supply an image. This is
// the fallback WhatsApp / Facebook / LinkedIn / X / Telegram use when
// a specific page hasn't provided its own preview image.
//
// Rendered dynamically as a proper 1200x630 PNG so the URL always
// returns HTTP 200. Previously the codebase referenced /og-default.jpg
// which never existed in /public, so scrapers fetched a 404 and simply
// dropped the preview image, leaving only title + description.
export const runtime = 'edge';
export const contentType = 'image/png';
export const alt = 'Safar Curated — Experience Kashmir Like a Local';
export const size = { width: 1200, height: 630 };

export default function DefaultOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #064E3B 0%, #0F766E 55%, #059669 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2C7.58 2 4 5.58 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
                fill="#F5C451"
              />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>Safar</div>
            <div style={{ fontSize: 18, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>
              KASHMIR · CURATED
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.1,
            maxWidth: 900,
            letterSpacing: '-0.02em',
          }}
        >
          Experience Kashmir Like a Local
        </div>
        <div
          style={{
            fontSize: 26,
            marginTop: 24,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.85)',
            maxWidth: 800,
          }}
        >
          Curated stays, experiences, guides & rentals across Kashmir
        </div>
      </div>
    ),
    { ...size }
  );
}
