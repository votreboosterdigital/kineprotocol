export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { ProtocolViewer } from '@/components/protocol/ProtocolViewer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { ProtocolWithRelations } from '@/types/database'
import type { PatientWriterOutput } from '@/types/agents'

export default async function ProtocolDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ demo?: string }>
}) {
  const { id } = await params
  const { demo } = await searchParams

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
      {demo === 'true' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="font-medium text-amber-800">👋 Ceci est votre protocole de démonstration</p>
            <p className="text-sm text-amber-600">Généré automatiquement pour vous montrer les capacités de KinéProtocol AI</p>
          </div>
          <Link href="/protocols/new">
            <Button size="sm">Créer mon premier protocole →</Button>
          </Link>
        </div>
      )}
      <Header
        title={`Protocole — ${protocol.pathology.name}`}
        description={`Phase: ${protocol.phase.name} · Créé le ${new Date(protocol.createdAt).toLocaleDateString('fr-FR')}`}
      />
      <ProtocolViewer protocol={protocol} patientVersion={patientVersion} />
    </div>
  )
}
