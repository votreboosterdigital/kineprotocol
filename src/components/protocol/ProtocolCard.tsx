import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProtocolWithRelations } from '@/types/database'

interface ProtocolCardProps {
  protocol: ProtocolWithRelations
}

export function ProtocolCard({ protocol }: ProtocolCardProps) {
  return (
    <Link href={`/protocols/${protocol.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{protocol.pathology.name}</CardTitle>
            <Badge variant="secondary">{protocol.phase.name}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-500 space-y-1">
            {protocol.patientAge && <span>Âge: {protocol.patientAge} ans</span>}
            {protocol.patientSport && <span> · {protocol.patientSport}</span>}
            <p className="text-xs text-slate-400">
              {protocol.exercises.length} exercices ·{' '}
              {new Date(protocol.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
