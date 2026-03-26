export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const exercise = await prisma.exercise.findUnique({ where: { id } })
  if (!exercise) notFound()

  return (
    <div>
      <Header
        title={exercise.name}
        description={`${exercise.region} · ${exercise.type} · ${exercise.level}`}
      />
      <div className="grid grid-cols-2 gap-6 max-w-4xl">
        <Card>
          <CardHeader><CardTitle className="text-base">Description technique</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-slate-600">{exercise.description}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Consignes clés</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {exercise.cues.map((c, i) => <li key={i} className="text-sm">• {c}</li>)}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Erreurs fréquentes</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {exercise.commonErrors.map((e, i) => <li key={i} className="text-sm text-red-600">⚠️ {e}</li>)}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Variantes</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {exercise.variants.map((v, i) => <li key={i} className="text-sm">→ {v}</li>)}
            </ul>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader><CardTitle className="text-base">Matériel & Tags</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {exercise.equipment.map(e => <Badge key={e} variant="outline">{e}</Badge>)}
              {exercise.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
