'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ExerciseForm() {
  return (
    <div className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label>Nom de l&apos;exercice</Label>
        <Input placeholder="Ex: Squat isométrique contre mur" />
      </div>
      <Button disabled>Bientôt disponible</Button>
    </div>
  )
}
