export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { ProtocolViewer } from '@/components/protocol/ProtocolViewer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { ProtocolWithRelations } from '@/types/database'
import type { PatientWriterOutput } from '@/types/agents'

interface LiteratureReference {
  title: string
  authors: string
  year: number
  journal?: string
  pmid?: string | null
  url?: string
}

interface LiteratureCache {
  keyReferences?: LiteratureReference[]
  clinicalConsensus?: { summary?: string }
  openDebates?: Array<{ topic: string; position1: string; position2: string }>
  contraindications?: { absolute?: string[]; relative?: string[] }
  clinicalPearlsForProtocol?: string[]
}

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

  // Récupération des sources cliniques depuis le cache si disponibles
  const hasLiterature = (protocol as ProtocolWithRelations & { hasLiteratureContext?: boolean }).hasLiteratureContext
  let literatureCache: LiteratureCache | null = null
  if (hasLiterature) {
    try {
      const rows = await prisma.$queryRaw<Array<{ content: unknown }>>`
        SELECT content FROM literature_cache
        WHERE pathology = ${protocol.pathology.name.toLowerCase().trim()}
        LIMIT 1
      `
      if (rows.length > 0) {
        literatureCache = rows[0].content as LiteratureCache
      }
    } catch {
      // cache non disponible — pas bloquant
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
      <ProtocolViewer protocol={protocol} patientVersion={patientVersion} literatureCache={literatureCache} />
    </div>
  )
}
