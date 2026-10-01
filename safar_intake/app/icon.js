import { ImageResponse } from 'next/og';

// Next.js file convention: this route auto-serves as `/icon` and the
// framework injects appropriate <link rel="icon"> tags into every page.
// Multiple exports below let us provide multiple crisp sizes (16/32/48/192/512)
// so browsers, bookmarks, PWA installers and search engines all get a native PNG.
export const runtime = 'edge';
export const contentType = 'image/png';

// Sizes generated at build time. Each entry becomes a distinct route + <link>.
export const size = { width: 32, height: 32 };

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0F766E 0%, #059669 100%)',
          borderRadius: '22%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C7.58 2 4 5.58 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="#F5C451"/>
        </svg>
      </div>
    ),
    { ...size }
  );
}
