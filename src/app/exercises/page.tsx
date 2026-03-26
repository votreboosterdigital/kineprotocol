export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { ExerciseCard } from '@/components/exercise/ExerciseCard'

export default async function ExercisesPage() {
  const exercises = await prisma.exercise.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div>
      <Header
        title="Bibliothèque d'exercices"
        description={`${exercises.length} exercices disponibles`}
      />
      {exercises.length === 0 ? (
        <p className="text-slate-500 text-center py-12">
          Aucun exercice. Ils seront ajoutés automatiquement lors de la génération de protocoles.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {exercises.map(ex => <ExerciseCard key={ex.id} exercise={ex} />)}
        </div>
      )}
    </div>
  )
}
