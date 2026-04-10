import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProtocolWithRelations } from '@/types/database'

interface ProtocolCardProps {
  protocol: ProtocolWithRelations
}

export function ProtocolCard({ protocol }: ProtocolCardProps) {
  // hasLiteratureContext est un champ optionnel (ajouté via migration manuelle)
  const hasLiterature = (protocol as ProtocolWithRelations & { hasLiteratureContext?: boolean }).hasLiteratureContext

  return (
    <Link href={`/protocols/${protocol.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{protocol.pathology.name}</CardTitle>
            <div className="flex items-center gap-1.5 shrink-0">
              {hasLiterature && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(45,106,79,0.12)',
                    color: '#2D6A4F',
                    border: '1px solid rgba(45,106,79,0.25)',
                  }}
                >
                  🔬 Sources vérifiées
                </span>
              )}
              <Badge variant="secondary">{protocol.phase.name}</Badge>
            </div>
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
