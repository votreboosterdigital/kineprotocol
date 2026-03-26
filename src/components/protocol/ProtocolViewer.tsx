'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { ProtocolWithRelations } from '@/types/database'
import type { PatientWriterOutput } from '@/types/agents'

interface ProtocolViewerProps {
  protocol: ProtocolWithRelations
  patientVersion: PatientWriterOutput | null
}

export function ProtocolViewer({ protocol, patientVersion }: ProtocolViewerProps) {
  const sessionStructure = protocol.sessionStructure as {
    warmup: { duration: number; description: string }
    main: { duration: number; description: string }
    cooldown: { duration: number; description: string }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge className="text-sm">{protocol.pathology.name}</Badge>
        <Badge variant="outline">{protocol.phase.name}</Badge>
        {protocol.patientSport && <Badge variant="secondary">{protocol.patientSport}</Badge>}
      </div>
      <Tabs defaultValue="protocol">
        <TabsList>
          <TabsTrigger value="protocol">Protocole kiné</TabsTrigger>
          <TabsTrigger value="patient">Version patient</TabsTrigger>
        </TabsList>
        <TabsContent value="protocol" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Objectifs de la phase</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {protocol.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-500 mt-0.5">•</span> {obj}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Structure de séance</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {(['warmup', 'main', 'cooldown'] as const).map(key => (
                  <div key={key} className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium text-sm">
                      {key === 'warmup' ? 'Échauffement' : key === 'main' ? 'Corps principal' : 'Retour au calme'}
                    </p>
                    <p className="text-xs text-slate-500">{sessionStructure[key]?.duration} min</p>
                    <p className="text-xs text-slate-600 mt-1">{sessionStructure[key]?.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Exercices ({protocol.exercises.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {protocol.exercises.map(({ exercise, order, sets, reps, rest, notes }) => (
                  <div key={exercise.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{order}. {exercise.name}</p>
                        <p className="text-sm text-slate-500 mt-1">{exercise.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          {sets && <span>{sets} séries</span>}
                          {reps && <span>× {reps}</span>}
                          {rest && <span>Repos: {rest}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{exercise.type}</Badge>
                        <Badge variant="outline" className="text-xs">{exercise.level}</Badge>
                      </div>
                    </div>
                    {notes && <p className="text-xs text-amber-600 mt-1">Note: {notes}</p>}
                    <Separator className="mt-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Critères de progression</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {protocol.progression.map((c, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-500">✓</span> {c}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="patient">
          {patientVersion ? (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>{patientVersion.title}</CardTitle></CardHeader>
                <CardContent><p className="text-slate-600">{patientVersion.introduction}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Vos objectifs</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {patientVersion.objectives.map((obj, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-blue-500">•</span> {obj}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Vos exercices</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {patientVersion.exercises.map((ex, i) => (
                    <div key={i} className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium">{i + 1}. {ex.name}</p>
                      <p className="text-sm text-blue-700 font-medium mt-1">{ex.sets}</p>
                      <p className="text-sm text-slate-600 mt-1">{ex.howTo}</p>
                      <p className="text-xs text-slate-500 mt-2 italic">💡 {ex.tip}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              {patientVersion.importantWarnings.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader><CardTitle className="text-base text-red-700">Signes d&apos;alarme</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {patientVersion.importantWarnings.map((w, i) => (
                        <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                          <span>⚠️</span> {w}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-green-700">{patientVersion.motivationalClose}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-slate-500">Version patient non disponible.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
