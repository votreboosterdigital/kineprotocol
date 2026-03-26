import { NextRequest, NextResponse } from 'next/server'
import { writePatientVersion } from '@/lib/agents/patient-writer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await writePatientVersion(body)
    return NextResponse.json({ success: true, patientVersion: result })
  } catch (error) {
    console.error('[patient-version]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
