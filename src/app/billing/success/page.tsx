import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold">Abonnement activé !</h1>
        <p className="text-slate-500">Votre plan a été mis à jour avec succès.</p>
        <Link href="/billing">
          <Button>Voir mon abonnement</Button>
        </Link>
      </div>
    </div>
  )
}
