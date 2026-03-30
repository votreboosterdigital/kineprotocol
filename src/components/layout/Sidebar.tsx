'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ClipboardList, Dumbbell, Stethoscope, LogOut, Menu, X, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/protocols', label: 'Protocoles', icon: ClipboardList },
  { href: '/exercises', label: 'Exercices', icon: Dumbbell },
  { href: '/pathologies', label: 'Pathologies', icon: Stethoscope },
]

const PLAN_BADGE: Record<string, string> = {
  FREE: 'bg-slate-700 text-slate-300',
  PRO: 'bg-sky-900/60 text-sky-300',
  CABINET: 'bg-violet-900/60 text-violet-300',
}

interface UserInfo {
  firstName: string | null
  lastName: string | null
  email: string | null
  plan: string
}

function UserAvatar({ firstName, lastName }: { firstName?: string | null; lastName?: string | null }) {
  const initials = [firstName, lastName].filter(Boolean).map(n => n![0].toUpperCase()).join('')
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
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
      <div className="p-6 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-white tracking-tight">KinéProtocol</h1>
          <span className="bg-sky-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">AI</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Rééducation assistée par IA</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-sky-400' : 'text-slate-500')} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer utilisateur */}
      <div className="p-4 border-t border-slate-700/60 space-y-3">
        {/* Profil */}
        <Link
          href="/profile"
          onClick={() => setOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group',
            pathname === '/profile'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              : 'hover:bg-slate-800'
          )}
        >
          <UserAvatar firstName={user?.firstName} lastName={user?.lastName} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email?.split('@')[0] ?? 'Mon profil'}
            </p>
            {user?.plan && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PLAN_BADGE[user.plan] ?? PLAN_BADGE.FREE}`}>
                {user.plan}
              </span>
            )}
          </div>
          <Settings className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 transition-colors" />
        </Link>

        {/* Actions bas */}
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="sm" type="submit" className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-xs">Déconnexion</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-slate-900 text-white p-2 rounded-md"
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
          'w-64 min-h-screen bg-slate-900 text-slate-100 flex flex-col fixed md:static z-50 transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Spacer desktop */}
      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  )
}
