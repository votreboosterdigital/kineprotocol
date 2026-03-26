import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Exercise } from '@prisma/client'

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link href={`/exercises/${exercise.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium">{exercise.name}</CardTitle>
            {exercise.aiGenerated && (
              <Badge variant="secondary" className="text-xs shrink-0">IA</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 line-clamp-2">{exercise.description}</p>
          <div className="flex gap-1 mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs">{exercise.region}</Badge>
            <Badge variant="outline" className="text-xs">{exercise.type}</Badge>
            <Badge variant="outline" className="text-xs">{exercise.level}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
