import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'KinéProtocol AI — Protocoles de rééducation en 30 secondes',
  description:
    "Générez automatiquement vos protocoles de rééducation. Basé sur Cochrane, JOSPT, Maitland. Gratuit jusqu'à 3 protocoles/mois.",
}

export default function LandingPage() {
  return (
    /* -m-6 contrebalance le p-6 du layout root */
    <div className="-m-6 min-h-screen" style={{ background: '#080A0F', color: '#EDF2F8' }}>

      {/* ── Nav ── */}
      <header
        className="sticky top-0 z-50"
        style={{ background: 'rgba(8,10,15,0.9)', borderBottom: '1px solid #1D2333', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-[15px]" style={{ color: '#EDF2F8' }}>KinéProtocol</span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,200,150,0.15)', color: '#00C896' }}>AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#how" className="text-sm transition-colors" style={{ color: '#A8B4C8' }}>Comment ça marche</a>
            <a href="#pricing" className="text-sm transition-colors" style={{ color: '#A8B4C8' }}>Tarifs</a>
            <Link href="/login" className="text-sm transition-colors" style={{ color: '#A8B4C8' }}>Connexion</Link>
          </nav>
          <Link
            href="/login"
            className="btn-shimmer text-sm font-medium px-5 py-2 rounded-lg"
            style={{ color: '#080A0F' }}
          >
            Commencer gratuitement →
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Gauche */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)', color: '#00C896' }}>
              Conçu par un kinésithérapeute
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl leading-tight" style={{ color: '#EDF2F8' }}>
              Vos protocoles en 30 secondes, pas 30 minutes.
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: '#A8B4C8' }}>
              KinéProtocol AI génère des protocoles de rééducation structurés, basés sur les recommandations Cochrane et JOSPT — avec un document patient en langage clair, immédiatement.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/login"
                className="btn-shimmer inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-medium"
                style={{ color: '#080A0F' }}
              >
                Générer mon premier protocole →
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: '#0C0F17', border: '1px solid #253044', color: '#A8B4C8' }}
              >
                Voir la démo
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {['Gratuit jusqu\'à 3 protocoles/mois', 'Sans carte bancaire', 'Export PDF inclus'].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-xs" style={{ color: '#5A6880' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="#00C896" strokeWidth="1.5"/>
                    <path d="M3.5 6l2 2 3-3" stroke="#00C896" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Droite — image hero + carte protocole preview */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid #1D2333' }}>
              <Image
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200"
                alt="Kinésithérapeute en consultation avec un patient"
                width={600}
                height={300}
                className="object-cover w-full"
                priority
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,10,15,0.7) 0%, transparent 60%)' }} />
            </div>
          <div className="rounded-2xl p-6 space-y-4" style={{ background: '#0C0F17', border: '1px solid #1D2333' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex text-xs font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.2)', color: '#00C896' }}>
                  Lombalgie chronique
                </div>
                <p className="font-display font-bold text-base mt-2" style={{ color: '#EDF2F8' }}>Phase 2 — Renforcement</p>
                <p className="text-xs mt-0.5" style={{ color: '#5A6880' }}>6 semaines · 3×/semaine · Modérée</p>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #1D2333' }} />
            <div className="space-y-2">
              {[
                { n: 1, label: 'Stabilisation lombaire active', params: '3 × 12 rép.', c: '#00C896' },
                { n: 2, label: 'Gainage antérieur progressif', params: '3 × 30s', c: '#eab308' },
                { n: 3, label: 'Mobilisation lombopelvienne', params: '2 × 15 rép.', c: '#00C896' },
              ].map(ex => (
                <div key={ex.n} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#111520' }}>
                  <span className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center shrink-0"
                    style={{ background: `${ex.c}20`, color: ex.c }}>{ex.n}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#EDF2F8' }}>{ex.label}</p>
                    <p className="text-xs" style={{ color: '#5A6880' }}>{ex.params}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: '#5A6880' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Document patient généré · PDF prêt
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ borderTop: '1px solid #1D2333', borderBottom: '1px solid #1D2333' }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { val: '30s', label: 'Génération d\'un protocole complet' },
              { val: '3', label: 'Agents IA spécialisés coordonnés' },
              { val: '100%', label: 'Basé sur Cochrane, JOSPT, Maitland' },
              { val: '2', label: 'Documents générés praticien + patient' },
            ].map(s => (
              <div key={s.val} className="text-center space-y-1">
                <div className="font-display font-extrabold text-3xl" style={{ color: '#00C896' }}>{s.val}</div>
                <p className="text-xs" style={{ color: '#5A6880' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl" style={{ color: '#EDF2F8' }}>Comment ça marche</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              num: '01',
              title: 'Renseignez le contexte',
              body: 'Pathologie, phase de rééducation, âge du patient, contre-indications éventuelles, objectif de séance. Formulaire structuré, 45 secondes à remplir.',
            },
            {
              num: '02',
              title: 'L\'IA génère le protocole',
              body: 'Trois agents Claude travaillent en parallèle : protocole praticien structuré, document patient en langage accessible, alertes contre-indications.',
            },
            {
              num: '03',
              title: 'Exportez et partagez',
              body: 'Export PDF en un clic. Document praticien et document patient séparés. Archivé dans votre historique, retrouvable en quelques secondes.',
            },
          ].map(s => (
            <div key={s.num} className="space-y-4">
              <div className="font-display font-extrabold text-6xl" style={{ color: '#1D2333' }}>{s.num}</div>
              <h3 className="font-display font-bold text-lg" style={{ color: '#EDF2F8' }}>{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#A8B4C8' }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Grande card 2/3 */}
          <div className="md:col-span-2 rounded-2xl p-8 space-y-4" style={{ background: '#0C0F17', border: '1px solid #1D2333' }}>
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: 'rgba(0,200,150,0.1)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
            </div>
            <h3 className="font-display font-bold text-xl" style={{ color: '#EDF2F8' }}>Agent Protocole Clinique</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#A8B4C8' }}>
              Protocole complet avec exercices, séries, répétitions, temps de repos, progressions. Structuré selon les recommandations evidence-based.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Cochrane', 'JOSPT', 'Maitland', 'Explain Pain'].map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)', color: '#00C896' }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* 2 petites cards */}
          <div className="space-y-6">
            <div className="rounded-2xl p-6 space-y-3" style={{ background: '#0C0F17', border: '1px solid #1D2333' }}>
              <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: 'rgba(0,200,150,0.1)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <h3 className="font-display font-bold text-base" style={{ color: '#EDF2F8' }}>Document patient</h3>
              <p className="text-xs" style={{ color: '#A8B4C8' }}>Réécrit en langage accessible automatiquement.</p>
              <span className="text-xs font-medium" style={{ color: '#5A6880' }}>Généré automatiquement</span>
            </div>
            <div className="rounded-2xl p-6 space-y-3" style={{ background: '#0C0F17', border: '1px solid #1D2333' }}>
              <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: 'rgba(0,200,150,0.1)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              </div>
              <h3 className="font-display font-bold text-base" style={{ color: '#EDF2F8' }}>Alertes intelligentes</h3>
              <p className="text-xs" style={{ color: '#A8B4C8' }}>Détection automatique des contre-indications.</p>
              <span className="text-xs font-medium" style={{ color: '#5A6880' }}>Sécurité clinique</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Démo produit 3 colonnes ── */}
      <section id="demo" style={{ borderTop: '1px solid #1D2333' }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <h2 className="font-display font-bold text-3xl mb-4" style={{ color: '#EDF2F8' }}>
              Ce que génère KinéProtocol en 30 secondes
            </h2>
            <p className="text-sm" style={{ color: '#A8B4C8' }}>
              Exemple réel · Tendinopathie rotulienne, Phase 2 aiguë, patient sédentaire 45 ans
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {/* Colonne 1 : Input */}
            <div className="rounded-2xl p-6 space-y-4" style={{ background: '#0C0F17', border: '1px solid #1D2333' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(0,200,150,0.15)', color: '#00C896' }}>1</div>
                <span className="text-sm font-semibold" style={{ color: '#EDF2F8' }}>Votre bilan</span>
              </div>
              {[
                { label: 'Pathologie', value: 'Tendinopathie rotulienne' },
                { label: 'Phase', value: 'Phase 2 — Aiguë' },
                { label: 'Contexte patient', value: 'Homme 45 ans, sédentaire, douleur VAS 6/10' },
              ].map(field => (
                <div key={field.label}>
                  <p className="text-xs font-medium mb-1" style={{ color: '#5A6880' }}>{field.label}</p>
                  <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#080A0F', color: '#A8B4C8', border: '1px solid #1D2333' }}>{field.value}</p>
                </div>
              ))}
            </div>
            {/* Colonne 2 : Traitement IA */}
            <div className="rounded-2xl p-6 flex flex-col items-center justify-center gap-4 min-h-[200px]"
              style={{ background: 'rgba(0,200,150,0.05)', border: '1px solid rgba(0,200,150,0.2)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(0,200,150,0.12)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="1.5">
                  <path d="M12 2a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2V4a2 2 0 012-2z"/>
                  <path d="M4 12a2 2 0 012-2h2a2 2 0 012 2 2 2 0 01-2 2H6a2 2 0 01-2-2z"/>
                  <path d="M14 12a2 2 0 012-2h2a2 2 0 012 2 2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  <path d="M12 14a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2v-2a2 2 0 012-2z"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold mb-1" style={{ color: '#EDF2F8' }}>KinéProtocol AI</p>
                <p className="text-xs" style={{ color: '#5A6880' }}>Cochrane · JOSPT · Maitland</p>
              </div>
              {['Protocol Designer', 'Exercise Librarian', 'Patient Writer'].map(agent => (
                <div key={agent} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs w-full"
                  style={{ background: 'rgba(0,200,150,0.08)', color: '#00C896' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />{agent}
                </div>
              ))}
            </div>
            {/* Colonne 3 : Output */}
            <div className="rounded-2xl p-6 space-y-4" style={{ background: '#0C0F17', border: '1px solid #1D2333' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(0,200,150,0.15)', color: '#00C896' }}>3</div>
                <span className="text-sm font-semibold" style={{ color: '#EDF2F8' }}>Protocole généré</span>
              </div>
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: '#00C896' }}>Objectifs</p>
                <ul className="text-xs space-y-1" style={{ color: '#A8B4C8' }}>
                  <li>• Réduire la douleur rotulienne (VAS &lt; 3)</li>
                  <li>• Renforcer le quadriceps en excentrique</li>
                  <li>• Reprendre les escaliers sans compensation</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: '#00C896' }}>Exercices — Semaine 1–2</p>
                <div className="space-y-2">
                  {[
                    { n: 1, name: 'Squat excentrique sur marche', sets: '3 × 15 reps · 6s descente' },
                    { n: 2, name: 'Isométrique quadriceps 60°', sets: '5 × 45s · douleur max 3/10' },
                    { n: 3, name: 'Vélo stationnaire doux', sets: '2 × 10 min · FC < 120 bpm' },
                  ].map(ex => (
                    <div key={ex.n} className="flex gap-2 p-2 rounded-lg" style={{ background: '#080A0F' }}>
                      <span className="text-xs font-bold w-4 shrink-0 mt-0.5" style={{ color: '#00C896' }}>{ex.n}.</span>
                      <div>
                        <p className="text-xs font-medium" style={{ color: '#EDF2F8' }}>{ex.name}</p>
                        <p className="text-[11px]" style={{ color: '#5A6880' }}>{ex.sets}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
                <span className="text-xs" style={{ color: '#5A6880' }}>Document patient simplifié inclus (PDF)</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── Pricing ── */}
      <section id="pricing" style={{ borderTop: '1px solid #1D2333' }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl" style={{ color: '#EDF2F8' }}>Tarifs simples</h2>
            <p className="mt-3 text-sm" style={{ color: '#A8B4C8' }}>Commencez gratuitement, passez au Pro quand vous êtes prêt.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'FREE',
                price: '0€',
                period: 'Pour toujours',
                badge: null as string | null,
                features: ['3 protocoles/mois', 'Export PDF avec filigrane', 'Document praticien + patient'],
                cta: 'Commencer gratuitement',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '29€',
                period: 'par mois',
                badge: 'Le plus populaire' as string | null,
                features: ['Protocoles illimités', 'Sans filigrane', 'Historique complet', 'Support prioritaire'],
                cta: 'Commencer en Pro',
                highlight: true,
              },
              {
                name: 'Cabinet',
                price: '79€',
                period: 'par mois · jusqu\'à 5 praticiens',
                badge: null as string | null,
                features: ['Tout du Pro', '5 comptes praticiens', 'Analytics cabinet', 'Onboarding dédié'],
                cta: 'Contacter l\'équipe',
                highlight: false,
              },
            ].map(plan => (
              <div
                key={plan.name}
                className="rounded-2xl p-8 space-y-6 relative"
                style={{
                  background: plan.highlight ? 'rgba(0,200,150,0.05)' : '#0C0F17',
                  border: plan.highlight ? '1px solid rgba(0,200,150,0.4)' : '1px solid #1D2333',
                }}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: '#00C896', color: '#080A0F' }}>
                    {plan.badge}
                  </div>
                )}
                <div>
                  <h3 className="font-display font-bold text-lg" style={{ color: '#EDF2F8' }}>{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-display font-extrabold text-3xl" style={{ color: '#EDF2F8' }}>{plan.price}</span>
                    <span className="text-sm" style={{ color: '#5A6880' }}>{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: '#A8B4C8' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="block text-center py-3 rounded-xl text-sm font-medium transition-all"
                  style={plan.highlight ? { background: '#00C896', color: '#080A0F' } : { background: '#111520', border: '1px solid #253044', color: '#A8B4C8' }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{ borderTop: '1px solid #1D2333' }}>
        <div className="max-w-3xl mx-auto px-6 py-24 text-center space-y-6">
          <p className="text-xs uppercase tracking-widest" style={{ color: '#00C896' }}>Prêt à commencer ?</p>
          <h2 className="font-display font-bold text-4xl" style={{ color: '#EDF2F8' }}>
            Votre premier protocole en 30 secondes.
          </h2>
          <p className="text-sm" style={{ color: '#A8B4C8' }}>
            Rejoignez les kinésithérapeutes qui ont déjà automatisé la rédaction de leurs protocoles.
          </p>
          <Link
            href="/login"
            className="inline-flex btn-shimmer items-center justify-center px-8 py-3.5 rounded-xl text-sm font-bold"
            style={{ color: '#080A0F' }}
          >
            Générer mon premier protocole →
          </Link>
          <p className="text-xs" style={{ color: '#5A6880' }}>
            Aucune carte bancaire · Résiliation en 1 clic · Support en français
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #1D2333' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: '#5A6880' }}>© 2025 KinéProtocol AI · Conçu à Montréal</p>
          <div className="flex items-center gap-6">
            {['Mentions légales', 'Confidentialité', 'Contact'].map(l => (
              <a key={l} href="#" className="text-xs transition-colors" style={{ color: '#5A6880' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
