import './globals.css'
import { Providers } from './providers'
import PwaRegister from '@/components/safaros/pwa-register'

export const metadata = {
  title: 'SafarOS — Travel Agency Operating Platform',
  description: 'Run your Gulf travel agency from one place. Manage enquiries, quotations, itineraries, bookings, fleet and customer communication with SafarOS.',
  manifest: '/manifest.json',
  applicationName: 'SafarOS',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'SafarOS' },
  icons: { icon: '/safaros-icon.svg', apple: '/safaros-icon.svg' },
}

export const viewport = {
  themeColor: '#0b1224',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body>
        <Providers>{children}<PwaRegister /></Providers>
      </body>
    </html>
  )
}
