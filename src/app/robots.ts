import type { MetadataRoute } from 'next'

// Règles d'indexation pour les robots d'exploration
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/landing', '/pricing', '/login'],
        // Pages applicatives privées : exclues de l'indexation
        disallow: [
          '/api/',
          '/protocols/',
          '/exercises/',
          '/pathologies/',
          '/profile',
          '/billing',
          '/demo',
          '/auth/',
        ],
      },
    ],
    sitemap: 'https://kineprot.vercel.app/sitemap.xml',
  }
}
