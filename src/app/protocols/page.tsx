export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { ProtocolCard } from '@/components/protocol/ProtocolCard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { ProtocolWithRelations } from '@/types/database'

export default async function ProtocolsPage() {
  const protocols = await prisma.protocol.findMany({
    orderBy: { createdAt: 'desc' },
    include: { pathology: true, phase: true, exercises: { include: { exercise: true } } },
  }) as ProtocolWithRelations[]

  return (
    <div>
      <Header
        title="Protocoles"
        description={`${protocols.length} protocoles générés`}
        action={<Link href="/protocols/new"><Button>Nouveau protocole</Button></Link>}
      />
      {protocols.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>Aucun protocole généré.</p>
          <Link href="/protocols/new"><Button className="mt-4">Générer le premier</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {protocols.map(p => <ProtocolCard key={p.id} protocol={p} />)}
        </div>
      )}
    </div>
  )
}
