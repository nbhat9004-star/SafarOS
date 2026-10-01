import { ImageResponse } from 'next/og';

// Apple Touch Icon — 180x180 rendered dynamically as PNG (iOS/Safari
// pinned tabs, home-screen install, and macOS bookmark previews all use
// this endpoint). Next.js auto-injects <link rel="apple-touch-icon"> that
// points here.
export const runtime = 'edge';
export const contentType = 'image/png';
export const size = { width: 180, height: 180 };

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0F766E 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="110" height="110" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C7.58 2 4 5.58 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="#F5C451"/>
        </svg>
      </div>
    ),
    { ...size }
  );
}
