'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ClipboardList, Dumbbell, Stethoscope, LogOut, Menu, X, Settings, CreditCard, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/protocols', label: 'Protocoles', icon: ClipboardList },
  { href: '/exercises', label: 'Exercices', icon: Dumbbell },
  { href: '/pathologies', label: 'Pathologies', icon: Stethoscope },
  { href: '/billing', label: 'Facturation', icon: CreditCard },
]

interface UserInfo {
  firstName: string | null
  lastName: string | null
  email: string | null
  plan: string
}

function UserAvatar({ firstName, lastName }: { firstName?: string | null; lastName?: string | null }) {
  const initials = [firstName, lastName].filter(Boolean).map(n => n![0].toUpperCase()).join('')
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
      style={{ background: 'rgba(0,200,150,0.2)', color: '#00C896' }}>
      {initials || '?'}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then(r => r.ok ? r.json() : null),
      fetch('/api/billing/info').then(r => r.ok ? r.json() : null),
    ]).then(([p, b]) => {
      if (p) setUser({ firstName: p.firstName, lastName: p.lastName, email: p.email, plan: b?.plan ?? 'FREE' })
    })
  }, [])

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6" style={{ borderBottom: '1px solid #1D2333' }}>
        <div className="flex items-center gap-2">
          <h1 className="font-display font-bold text-[15px] tracking-tight" style={{ color: '#EDF2F8' }}>
            KinéProtocol
          </h1>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,200,150,0.15)', color: '#00C896' }}>
            AI
          </span>
        </div>
        <p className="text-[11px] mt-1" style={{ color: '#5A6880' }}>Rééducation assistée par IA</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-0.5">
        <p className="text-[9px] uppercase tracking-[1.5px] mb-3 px-3" style={{ color: '#5A6880' }}>Navigation</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150',
                active ? 'border-r-2' : 'rounded-lg'
              )}
              style={active ? {
                background: 'rgba(0,200,150,0.1)',
                color: '#00C896',
                borderRightColor: '#00C896',
              } : {
                color: '#5A6880',
                fontWeight: 300,
              }}
              onMouseEnter={e => {
                if (!active) {
                  ;(e.currentTarget as HTMLElement).style.color = '#A8B4C8'
                  ;(e.currentTarget as HTMLElement).style.background = '#0C0F17'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  ;(e.currentTarget as HTMLElement).style.color = '#5A6880'
                  ;(e.currentTarget as HTMLElement).style.background = ''
                }
              }}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                style={{ opacity: active ? 1 : 0.6, stroke: active ? '#00C896' : 'currentColor' }}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bandeau upgrade — FREE uniquement */}
      {user?.plan === 'FREE' && (
        <div className="mx-4 mb-2 rounded-lg p-3" style={{ background: 'rgba(0,200,150,0.07)', border: '1px solid rgba(0,200,150,0.2)' }}>
          <p className="text-[11px] font-semibold mb-1 flex items-center gap-1.5" style={{ color: '#00C896' }}>
            <Zap className="h-3 w-3" /> Passez en Pro
          </p>
          <p className="text-[10px] leading-relaxed" style={{ color: '#5A6880' }}>
            3 protocoles/mois sur le plan gratuit. Débloquez l&apos;accès illimité.
          </p>
          <Link href="/billing" onClick={() => setOpen(false)}
            className="mt-2 inline-block text-[10px] font-semibold rounded px-2 py-1 transition-opacity hover:opacity-80"
            style={{ background: 'rgba(0,200,150,0.15)', color: '#00C896' }}>
            Voir les tarifs →
          </Link>
        </div>
      )}

      {/* Footer utilisateur */}
      <div className="p-4 space-y-3" style={{ borderTop: '1px solid #1D2333' }}>
        <Link
          href="/profile"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group"
          style={{ color: pathname === '/profile' ? '#00C896' : '#A8B4C8' }}
        >
          <UserAvatar firstName={user?.firstName} lastName={user?.lastName} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#EDF2F8' }}>
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email?.split('@')[0] ?? 'Mon profil'}
            </p>
            {user?.plan && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(0,200,150,0.1)', color: '#00C896' }}>
                {user.plan}
              </span>
            )}
          </div>
          <Settings className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
            style={{ color: '#5A6880' }} />
        </Link>

        <form action="/auth/signout" method="post">
          <Button variant="ghost" size="sm" type="submit" className="w-full justify-start gap-1.5"
            style={{ color: '#5A6880' }}>
            <LogOut className="h-3.5 w-3.5" />
            <span className="text-xs">Déconnexion</span>
          </Button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md"
        style={{ background: '#0C0F17', color: '#EDF2F8', border: '1px solid #1D2333' }}
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 min-h-screen flex flex-col fixed z-50 transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        style={{ background: '#080A0F', borderRight: '1px solid #1D2333', color: '#EDF2F8' }}
      >
        {sidebarContent}
      </aside>

      {/* Spacer desktop */}
      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  )
}
