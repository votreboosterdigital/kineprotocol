'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ClipboardList, Dumbbell, Stethoscope, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/protocols', label: 'Protocoles', icon: ClipboardList },
  { href: '/exercises', label: 'Exercices', icon: Dumbbell },
  { href: '/pathologies', label: 'Pathologies', icon: Stethoscope },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-white">KinéProtocol</h1>
          <span className="bg-sky-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">AI</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Rééducation assistée par IA</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="sm" type="submit" className="text-slate-300 hover:text-white">
              <LogOut className="h-4 w-4 mr-1" />
              Déconnexion
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
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — desktop always visible, mobile conditional */}
      <aside
        className={cn(
          'w-64 min-h-screen bg-slate-900 text-slate-100 flex flex-col fixed md:static z-50 transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Spacer for desktop layout */}
      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  )
}
