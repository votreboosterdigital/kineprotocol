import { NextRequest, NextResponse } from 'next/server'
import { enrichExercise } from '@/lib/agents/exercise-librarian'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, region, objective } = body
    if (!name || !region || !objective) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants: name, region, objective' },
        { status: 400 }
      )
    }
    const result = await enrichExercise({ name, region, objective })
    return NextResponse.json({ success: true, exercise: result })
  } catch (error) {
    // Logger l'erreur complète côté serveur, message générique au client
    console.error('[enrich-exercise]', error)
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'enrichissement de l'exercice" },
      { status: 500 }
    )
  }
}
