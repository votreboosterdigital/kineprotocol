'use client'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

/* Routes publiques sans sidebar */
const PUBLIC_ROUTES = ['/login', '/landing', '/demo']

export function ConditionalSidebar() {
  const pathname = usePathname()
  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
  if (isPublic) return null
  return <Sidebar />
}
