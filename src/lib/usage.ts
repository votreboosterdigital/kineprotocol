import { prisma } from '@/lib/prisma'
import { PLANS } from '@/lib/stripe'

export async function checkUsageLimit(userId: string): Promise<{
  allowed: boolean
  current: number
  limit: number
  plan: string
}> {
  const [subscription, monthlyCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.protocol.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ])

  const plan = (subscription?.plan ?? 'FREE') as keyof typeof PLANS
  const limit = PLANS[plan].limit

  return {
    allowed: monthlyCount < limit,
    current: monthlyCount,
    limit,
    plan,
  }
}
