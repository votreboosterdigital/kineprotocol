import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const exercises = await prisma.exercise.findMany({
      orderBy: { createdAt: 'desc' },
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
