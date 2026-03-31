import { NextRequest, NextResponse } from 'next/server'
import { writePatientVersion } from '@/lib/agents/patient-writer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await writePatientVersion(body)
    return NextResponse.json({ success: true, patientVersion: result })
  } catch (error) {
    // Logger l'erreur complète côté serveur, message générique au client
    console.error('[patient-version]', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération de la version patient' },
      { status: 500 }
    )
  }
}
