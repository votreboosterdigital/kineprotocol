'use client'
import { useState } from 'react'

/**
 * Widget Feedback flottant.
 *
 * Deux modes :
 * 1. TALLY_FORM_ID défini → iframe Tally embarquée
 * 2. TALLY_FORM_ID = 'PLACEHOLDER' → formulaire natif qui POST sur /api/feedback
 *
 * Pour activer Tally : créer un formulaire sur tally.so avec les champs :
 *   - Email (text, requis)
 *   - Message / Retour (textarea, requis)
 *   - Type (choix : Bug, Suggestion, Général)
 * Puis remplacer PLACEHOLDER par l'ID du formulaire (ex: 'wABCDE')
 */
const TALLY_FORM_ID = process.env.NEXT_PUBLIC_TALLY_FORM_ID ?? 'PLACEHOLDER'

type FeedbackType = 'bug' | 'suggestion' | 'general'

interface FormState {
  email: string
  message: string
  type: FeedbackType
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>({ email: '', message: '', type: 'general' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data: { success: boolean; error?: string } = await res.json()
      if (data.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(data.error ?? 'Une erreur est survenue')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Impossible de contacter le serveur')
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => { setOpen(!open); setStatus('idle'); setErrorMsg('') }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all"
        style={{
          background: '#00C896',
          color: '#080A0F',
          boxShadow: '0 8px 30px rgba(0,200,150,0.2)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        Feedback
      </button>

      {/* Drawer */}
      {open && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Panel */}
          <div
            className="fixed bottom-20 right-6 z-50 w-80 rounded-2xl overflow-hidden"
            style={{ background: '#0C0F17', border: '1px solid #1D2333', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1D2333' }}>
              <p className="text-sm font-medium" style={{ color: '#EDF2F8' }}>Votre avis compte</p>
              <button
                onClick={() => setOpen(false)}
                className="text-xs p-1 rounded transition-colors"
                style={{ color: '#5A6880' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Contenu */}
            {TALLY_FORM_ID !== 'PLACEHOLDER' ? (
              /* Mode Tally */
              <iframe
                src={`https://tally.so/r/${TALLY_FORM_ID}?transparentBackground=1`}
                width="100%"
                height="300"
                frameBorder="0"
                title="Feedback KinéProtocol"
                style={{ display: 'block' }}
              />
            ) : status === 'success' ? (
              /* Confirmation envoi */
              <div className="p-5 text-center space-y-2">
                <div className="text-2xl">✓</div>
                <p className="text-sm font-medium" style={{ color: '#00C896' }}>Merci pour votre retour !</p>
                <p className="text-xs" style={{ color: '#5A6880' }}>Nous en tiendrons compte.</p>
                <button
                  onClick={() => { setStatus('idle'); setForm({ email: '', message: '', type: 'general' }) }}
                  className="mt-2 text-xs underline"
                  style={{ color: '#5A6880' }}
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              /* Mode formulaire natif → POST /api/feedback */
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                {/* Sélecteur de type */}
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#A8B4C8' }}>Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as FeedbackType })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: '#141824', border: '1px solid #1D2333', color: '#EDF2F8' }}
                  >
                    <option value="general">Général</option>
                    <option value="suggestion">Suggestion</option>
                    <option value="bug">Bug</option>
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#A8B4C8' }}>Email</label>
                  <input
                    type="email"
                    required
                    placeholder="votre@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: '#141824', border: '1px solid #1D2333', color: '#EDF2F8' }}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#A8B4C8' }}>Message</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Décrivez votre retour..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: '#141824', border: '1px solid #1D2333', color: '#EDF2F8' }}
                  />
                </div>

                {/* Erreur */}
                {status === 'error' && (
                  <p className="text-xs" style={{ color: '#FF4D4D' }}>{errorMsg}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
                  style={{ background: '#00C896', color: '#080A0F' }}
                >
                  {status === 'loading' ? 'Envoi…' : 'Envoyer'}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </>
  )
}
