import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { ProtocolViewer } from '@/components/protocol/ProtocolViewer'
import type { ProtocolWithRelations } from '@/types/database'
import type { PatientWriterOutput } from '@/types/agents'

export default async function ProtocolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const protocol = await prisma.protocol.findUnique({
    where: { id },
    include: {
      pathology: true,
      phase: true,
      exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
    },
  }) as ProtocolWithRelations | null

  if (!protocol) notFound()

  let patientVersion: PatientWriterOutput | null = null
  if (protocol.patientVersion) {
    try {
      patientVersion = JSON.parse(protocol.patientVersion) as PatientWriterOutput
    } catch {
      // pas de version patient parseable
    }
  }

  return (
    <div>
      <Header
        title={`Protocole — ${protocol.pathology.name}`}
        description={`Phase: ${protocol.phase.name} · Créé le ${new Date(protocol.createdAt).toLocaleDateString('fr-FR')}`}
      />
      <ProtocolViewer protocol={protocol} patientVersion={patientVersion} />
    </div>
  )
}
