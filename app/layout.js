import './globals.css'
import { Providers } from './providers'

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#101a4b' };

export const metadata = {
  title: 'SafarOS — Run & Grow Your Travel Business',
  description: 'Bookings, customers, operations, WhatsApp and AI — all in one travel agency workspace.',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}