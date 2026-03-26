import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { ProtocolForm } from '@/components/protocol/ProtocolForm'

export default async function NewProtocolPage() {
  const [pathologies, phases] = await Promise.all([
    prisma.pathology.findMany({ orderBy: { name: 'asc' } }),
    prisma.phase.findMany({ orderBy: { order: 'asc' } }),
  ])

  return (
    <div>
      <Header
        title="Nouveau protocole"
        description="Renseignez les informations pour générer un protocole via Claude AI"
      />
      <ProtocolForm pathologies={pathologies} phases={phases} />
    </div>
  )
}
