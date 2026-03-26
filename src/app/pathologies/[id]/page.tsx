import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProtocolCard } from '@/components/protocol/ProtocolCard'
import Link from 'next/link'
import type { ProtocolWithRelations } from '@/types/database'

export default async function PathologyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pathology = await prisma.pathology.findUnique({
    where: { id },
    include: {
      protocols: {
        include: { pathology: true, phase: true, exercises: { include: { exercise: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!pathology) notFound()

  return (
    <div>
      <Header
        title={pathology.name}
        description={`Région: ${pathology.region}`}
        action={
          <Link href="/protocols/new">
            <Button>Générer un protocole</Button>
          </Link>
        }
      />
      <div className="flex gap-2 mb-6">
        {pathology.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
        {pathology.sport && <Badge variant="outline">Sport: {pathology.sport}</Badge>}
      </div>
      {pathology.description && <p className="text-slate-600 mb-6">{pathology.description}</p>}
      <h2 className="text-lg font-semibold mb-4">Protocoles générés ({pathology.protocols.length})</h2>
      <div className="grid grid-cols-3 gap-4">
        {(pathology.protocols as ProtocolWithRelations[]).map(p => <ProtocolCard key={p.id} protocol={p} />)}
      </div>
    </div>
  )
}
