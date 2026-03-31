import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Limite à 200 pour éviter de charger toute la bibliothèque en mémoire
    const exercises = await prisma.exercise.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        name: true,
        slug: true,
        region: true,
        objective: true,
        type: true,
        level: true,
        equipment: true,
        tags: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ success: true, exercises })
  } catch (error) {
    console.error('[exercises GET]', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des exercices' },
      { status: 500 }
    )
  }
}
