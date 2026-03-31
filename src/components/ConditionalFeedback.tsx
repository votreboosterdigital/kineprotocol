'use client'
import { usePathname } from 'next/navigation'
import { FeedbackWidget } from './FeedbackWidget'

const PUBLIC_ROUTES = ['/login', '/landing', '/demo']

export function ConditionalFeedback() {
  const pathname = usePathname()
  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
  if (isPublic) return null
  return <FeedbackWidget />
}
