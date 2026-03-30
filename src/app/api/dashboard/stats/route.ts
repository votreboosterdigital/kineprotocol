import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserSubscription } from '@/lib/billing'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [total, thisMonth, recent, sub] = await Promise.all([
    prisma.protocol.count({ where: { userId: user.id } }),
    prisma.protocol.count({ where: { userId: user.id, createdAt: { gte: startOfMonth } } }),
    prisma.protocol.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        pathology: { select: { name: true } },
        phase: { select: { name: true } },
        exercises: { select: { id: true } },
      },
    }),
    getUserSubscription(user.id),
  ])

  const PLAN_LIMITS: Record<string, number> = { FREE: 3, PRO: 50, CABINET: 999 }
  const limit = PLAN_LIMITS[sub.plan] ?? 3

  return NextResponse.json({
    total,
    thisMonth,
    limit,
    plan: sub.plan,
    recent: recent.map(p => ({
      id: p.id,
      pathology: p.pathology.name,
      phase: p.phase.name,
      exerciseCount: p.exercises.length,
      createdAt: p.createdAt,
    })),
  })
}
