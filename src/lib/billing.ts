import { prisma } from '@/lib/prisma'

export async function getUserSubscription(userId: string) {
  return prisma.subscription.upsert({
    where: { userId },
    create: { userId, plan: 'FREE' },
    update: {},
  })
}

export async function canGenerateProtocol(userId: string): Promise<{
  allowed: boolean
  reason?: string
  current: number
  limit: number
}> {
  const sub = await getUserSubscription(userId)

  if (sub.plan !== 'FREE') {
    return { allowed: true, current: 0, limit: Infinity }
  }

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const count = await prisma.protocol.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
  })

  if (count >= 3) {
    return {
      allowed: false,
      reason: 'Limite de 3 protocoles/mois atteinte sur le plan gratuit',
      current: count,
      limit: 3,
    }
  }

  return { allowed: true, current: count, limit: 3 }
}
