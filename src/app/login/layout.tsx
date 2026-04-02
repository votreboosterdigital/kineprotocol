import type { Metadata } from 'next'

// Métadonnées SEO pour la page de connexion
export const metadata: Metadata = {
  title: 'Connexion — KinéProtocol AI',
  description: 'Connectez-vous à votre espace KinéProtocol AI pour générer vos protocoles de rééducation.',
  robots: {
    // La page de connexion ne doit pas être indexée
    index: false,
    follow: false,
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
