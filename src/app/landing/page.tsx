import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/stripe'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header sticky */}
      <header className="sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-bold text-lg">KinéProtocol AI</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
              Se connecter
            </Link>
            <Link href="/login">
              <Button size="sm">Commencer gratuitement</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm px-4 py-1.5 rounded-full border border-blue-200 dark:border-blue-800">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          Nouveau · Propulsé par Claude AI
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
          Générez vos protocoles de rééducation en 30 secondes
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          KinéProtocol AI assiste les kinésithérapeutes dans la rédaction de protocoles evidence-based et de documents patients.
          Vous restez décisionnaire, l&apos;IA vous fait gagner 2h par jour.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">
              Essayer gratuitement — 3 protocoles offerts
            </Button>
          </Link>
          <a href="#demo">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Voir un exemple de protocole
            </Button>
          </a>
        </div>

        {/* Mockup interface */}
        <div className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6 text-left shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            <div className="grid grid-cols-3 gap-3 mt-4">
              {['Mobilité', 'Renforcement', 'Proprioception'].map((t) => (
                <div key={t} className="bg-blue-100 dark:bg-blue-900 rounded-lg p-3 text-center">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300">{t}</div>
                  <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded mt-2 w-2/3 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Le problème que vous connaissez bien</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '⏱️', text: '20 minutes perdues par protocole rédigé à la main' },
              { icon: '📄', text: 'Des documents patients génériques, peu engageants' },
              { icon: '🔄', text: 'Reprendre de zéro à chaque nouvelle pathologie' },
            ].map((p) => (
              <div key={p.text} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                <div className="text-4xl">{p.icon}</div>
                <p className="text-slate-700 dark:text-slate-300 font-medium">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-12">Comment ça marche</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              duration: '30 secondes',
              title: 'Vous entrez',
              desc: 'Pathologie, phase clinique, contexte patient (âge, sport, niveau)',
            },
            {
              step: '2',
              duration: '15 secondes',
              title: '3 agents IA génèrent',
              desc: 'Protocole structuré + exercices enrichis avec description, cues et erreurs fréquentes',
            },
            {
              step: '3',
              duration: 'Immédiat',
              title: 'Vous obtenez',
              desc: 'Protocole kiné complet + PDF patient imprimable et personnalisé',
            },
          ].map((s, i) => (
            <div key={i} className="relative text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-xl">
                {s.step}
              </div>
              <div className="text-xs text-blue-600 font-medium">{s.duration}</div>
              <h3 className="font-bold text-lg">{s.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Exemple protocole */}
      <section id="demo" className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Exemple de protocole généré</h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Entorse latérale de cheville</h3>
                <p className="text-sm text-slate-500">Phase Renforcement · Patient 32 ans, football amateur</p>
              </div>
              <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">Démo</span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Objectifs</p>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {[
                  'Renforcer les muscles fibulaires et le triceps sural',
                  'Améliorer la proprioception cheville à vitesse de jeu',
                  'Préparer le retour aux appuis monopodaux dynamiques',
                ].map((o) => (
                  <li key={o} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">→</span> {o}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Exercices</p>
              <div className="space-y-3">
                {[
                  { name: 'Élévations unipodales sur plan instable', sets: '3 × 15 reps', rest: '45s' },
                  { name: 'Renforcement excentrique fibulaires sur step', sets: '4 × 12 reps', rest: '60s' },
                  { name: 'Saut latéral monopodal avec réception contrôlée', sets: '3 × 8 reps', rest: '90s' },
                ].map((ex) => (
                  <div key={ex.name} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium">{ex.name}</p>
                      <p className="text-xs text-slate-500">{ex.sets} · Repos {ex.rest}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full" disabled>
              Voir le PDF patient complet →
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-4">Tarifs simples, sans surprise</h2>
        <p className="text-center text-slate-500 mb-10">Commencez gratuitement, passez au Pro quand vous êtes prêt.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => (
            <div
              key={key}
              className={`rounded-2xl border p-6 space-y-5 ${
                key === 'PRO'
                  ? 'border-blue-500 border-2 shadow-lg relative'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {key === 'PRO' && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Recommandé
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <div className="mt-1">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-extrabold">Gratuit</span>
                  ) : (
                    <span className="text-3xl font-extrabold">
                      {(plan.price / 100).toFixed(0)}€
                      <span className="text-base font-normal text-slate-500">/mois</span>
                    </span>
                  )}
                </div>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block">
                <Button className="w-full" variant={key === 'PRO' ? 'default' : 'outline'}>
                  Commencer {plan.price === 0 ? 'gratuitement' : `à ${(plan.price / 100).toFixed(0)}€/mois`}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <h2 className="text-2xl font-bold text-center mb-10">Questions fréquentes</h2>
          {[
            {
              q: "Est-ce que l'IA remplace le jugement clinique ?",
              a: "Non. KinéProtocol AI génère un brouillon que vous validez et adaptez. Vous restez l'expert.",
            },
            {
              q: 'Puis-je personnaliser les protocoles générés ?',
              a: 'Oui, chaque protocole est éditable après génération.',
            },
            {
              q: 'Les données de mes patients sont-elles sécurisées ?',
              a: "Aucune donnée patient nominative n'est transmise à l'IA. Vous entrez uniquement âge, sport et niveau.",
            },
            {
              q: 'Quels pays sont supportés ?',
              a: 'France, Suisse et Canada francophone. Paiement en EUR et CHF.',
            },
            {
              q: 'Puis-je annuler mon abonnement ?',
              a: "Oui, à tout moment depuis votre espace facturation. Pas d'engagement.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{q}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 text-center px-4">
        <h2 className="text-3xl font-extrabold mb-4">Prêt à gagner 2h par jour ?</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Aucune carte bancaire requise · 3 protocoles offerts · Annulation libre
        </p>
        <Link href="/login">
          <Button size="lg">Commencer gratuitement</Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} KinéProtocol AI · Mentions légales · Contact
      </footer>
    </div>
  )
}
