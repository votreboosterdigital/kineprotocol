import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'
import { ConditionalSidebar } from '@/components/layout/ConditionalSidebar'
import { ConditionalFeedback } from '@/components/ConditionalFeedback'
import { Analytics } from '@vercel/analytics/react'

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-display',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: {
    default: 'KinéProtocol AI — Protocoles de rééducation générés par IA',
    template: '%s | KinéProtocol AI',
  },
  description:
    'Générez des protocoles de rééducation structurés en 30 secondes. Basé sur Cochrane, JOSPT et Maitland. Conçu pour les kinésithérapeutes.',
  keywords: [
    'kinésithérapie',
    'protocole rééducation',
    'IA médicale',
    'kiné',
    'physiothérapie',
    'rééducation',
  ],
  authors: [{ name: 'KinéProtocol AI' }],
  creator: 'KinéProtocol AI',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://kineprot.vercel.app',
    siteName: 'KinéProtocol AI',
    title: 'KinéProtocol AI — Protocoles de rééducation générés par IA',
    description:
      'Générez des protocoles de rééducation structurés en 30 secondes. Basé sur Cochrane, JOSPT et Maitland.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KinéProtocol AI',
    description: 'Protocoles de rééducation générés par IA en 30 secondes.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${syne.variable} ${dmSans.variable} font-body`}>
        <div className="flex min-h-screen">
          <ConditionalSidebar />
          <main className="flex-1 min-h-screen overflow-y-auto p-6" style={{ background: '#080A0F' }}>
            {children}
          </main>
        </div>
        <ConditionalFeedback />
        <Analytics />
      </body>
    </html>
  )
}
