import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import { PatientProtocolPDF } from '@/lib/pdf/PatientProtocolPDF'
import type { PatientWriterOutput } from '@/types/agents'
import React, { type ReactElement } from 'react'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const protocol = await prisma.protocol.findUnique({
    where: { id },
    include: { pathology: true, phase: true },
  })

  if (!protocol) {
    return NextResponse.json({ error: 'Protocole non trouvé' }, { status: 404 })
  }

  if (!protocol.patientVersion) {
    return NextResponse.json({ error: 'Version patient non générée' }, { status: 404 })
  }

  let patientData: PatientWriterOutput
  try {
    patientData = JSON.parse(protocol.patientVersion) as PatientWriterOutput
  } catch {
    return NextResponse.json({ error: 'Version patient invalide' }, { status: 500 })
  }

  const element = React.createElement(PatientProtocolPDF, {
    data: patientData,
    pathologyName: protocol.pathology.name,
    phaseName: protocol.phase.name,
    generatedAt: protocol.createdAt,
  }) as unknown as ReactElement<DocumentProps>

  const buffer = await renderToBuffer(element)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="protocole-${protocol.id}.pdf"`,
    },
  })
}
