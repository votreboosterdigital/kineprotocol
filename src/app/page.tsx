import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtocolCard } from '@/components/protocol/ProtocolCard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { ProtocolWithRelations } from '@/types/database'

export default async function DashboardPage() {
  const [protocolCount, exerciseCount, pathologyCount, recentProtocols] = await Promise.all([
    prisma.protocol.count(),
    prisma.exercise.count(),
    prisma.pathology.count(),
    prisma.protocol.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { pathology: true, phase: true, exercises: { include: { exercise: true } } },
    }) as Promise<ProtocolWithRelations[]>,
  ])

  return (
    <div>
      <Header
        title="Dashboard"
        description="Vos protocoles de rééducation générés par IA"
        action={
          <Link href="/protocols/new">
            <Button>Nouveau protocole</Button>
          </Link>
        }
      />
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Protocoles générés', value: protocolCount },
          { label: 'Exercices en base', value: exerciseCount },
          { label: 'Pathologies', value: pathologyCount },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {recentProtocols.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Protocoles récents</h2>
          <div className="grid grid-cols-3 gap-4">
            {recentProtocols.map(p => <ProtocolCard key={p.id} protocol={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
