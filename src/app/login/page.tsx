'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /* Gère le cas Supabase PKCE redirect avec ?code= */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pkceCode = params.get('code')
    const errorType = params.get('error')
    if (errorType === 'otp_expired' || errorType === 'invalid_token') {
      setError('Votre lien de connexion a expiré. Les liens sont valables 10 minutes.')
    }
    if (pkceCode) {
      const supabase = createClient()
      supabase.auth.exchangeCodeForSession(pkceCode).then(({ error }) => {
        if (!error) {
          router.push('/')
        } else {
          setError('Lien expiré ou déjà utilisé. Demandez un nouveau code.')
        }
      })
    }
  }, [router])

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    /* Analytics non bloquant */
    try {
      const { trackEvent } = await import('@/lib/analytics')
      trackEvent.loginAttempted()
    } catch { /* analytics non bloquant */ }
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) {
      setError(error.message)
    } else {
      setStep('code')
    }
    setLoading(false)
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'magiclink',
    })
    if (error) {
      setError('Code invalide ou expiré. Réessayez.')
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: '#080A0F' }}
    >
      {/* Gradient décoratif */}
      <div
        className="absolute top-0 left-0 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,200,150,0.07) 0%, transparent 70%)',
          transform: 'translate(-20%, -20%)',
        }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-[400px] mx-4 rounded-2xl p-8 space-y-6"
        style={{ background: '#0C0F17', border: '1px solid #1D2333' }}
      >
        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h1 className="font-display font-bold text-xl" style={{ color: '#EDF2F8' }}>
              KinéProtocol
            </h1>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,200,150,0.15)', color: '#00C896' }}
            >
              AI
            </span>
          </div>
          <p className="text-sm" style={{ color: '#5A6880' }}>
            {step === 'email'
              ? 'Connexion par code à usage unique — aucun mot de passe'
              : `Code envoyé à ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium" style={{ color: '#A8B4C8' }}>
                Votre email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kiné@cabinet.fr"
                required
                className="w-full px-4 py-2.5 rounded-lg text-sm transition-all outline-none"
                style={{
                  background: '#111520',
                  border: '1px solid #253044',
                  color: '#EDF2F8',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#00C896'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,200,150,0.2)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#253044'
                  e.currentTarget.style.boxShadow = ''
                }}
              />
            </div>
            {error && (
              <div className="text-sm p-3 rounded-lg" style={{ background: 'rgba(0,200,150,0.05)', border: '1px solid rgba(0,200,150,0.2)', color: '#A8B4C8' }}>
                {error}
                {error.includes('expiré') && (
                  <Link href="/login" className="block mt-2 text-sm font-medium" style={{ color: '#00C896' }}>
                    Renvoyer un code →
                  </Link>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 btn-shimmer"
              style={{ color: '#080A0F' }}
            >
              {loading ? 'Envoi...' : 'Recevoir le code'}
            </button>
            <p className="text-sm text-center" style={{ color: '#5A6880' }}>
              Un code à 6 chiffres vous sera envoyé. Pensez à vérifier vos spams.
            </p>
            <p className="text-center">
              <Link href="/demo" className="text-sm font-medium" style={{ color: '#00C896' }}>
                Voir la démo →
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium" style={{ color: '#A8B4C8' }}>
                Code à 6 chiffres
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                required
                className="w-full px-4 py-2.5 rounded-lg text-sm text-center tracking-[0.5em] transition-all outline-none"
                style={{
                  background: '#111520',
                  border: '1px solid #253044',
                  color: '#EDF2F8',
                  fontSize: '1.25rem',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#00C896'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,200,150,0.2)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#253044'
                  e.currentTarget.style.boxShadow = ''
                }}
              />
              <p className="text-xs text-center" style={{ color: '#5A6880' }}>
                Vérifiez votre boîte mail (et vos spams)
              </p>
            </div>
            {error && <p className="text-sm p-3 rounded-lg" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#fca5a5' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 btn-shimmer"
              style={{ color: '#080A0F' }}
            >
              {loading ? 'Vérification...' : 'Se connecter'}
            </button>
            <button
              type="button"
              className="w-full py-2 text-sm transition-colors"
              style={{ color: '#5A6880' }}
              onClick={() => { setStep('email'); setCode(''); setError('') }}
            >
              ← Changer d&apos;email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
