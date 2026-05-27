import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'SafeDrive Sentinel — Global Vehicle Rescue Platform',
  description: 'Book verified flatbed rescue & vehicle transport worldwide. Live GPS tracking, instant quotes, PayPal payments.',
  keywords: ['flatbed towing', 'vehicle rescue', 'roadside assistance', 'car transport'],
  openGraph: {
    title: 'SafeDrive Sentinel',
    description: 'Global Vehicle Rescue & Flatbed Intelligence Platform',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-navy-950 text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  )
}
