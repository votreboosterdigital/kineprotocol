import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Route appelée par le cron Vercel toutes les 5 jours
// Maintient le projet Supabase actif (pause à 7 jours d'inactivité sur plan free)
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Requête minimale — juste pour garder la DB active
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, ts: new Date().toISOString() })
  } catch (err) {
    console.error('[keep-alive] Erreur ping Supabase:', err)
    return NextResponse.json({ error: 'DB ping failed' }, { status: 500 })
  }
}
