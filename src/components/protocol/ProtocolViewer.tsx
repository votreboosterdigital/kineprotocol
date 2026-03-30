'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import type { ProtocolWithRelations } from '@/types/database'
import type { PatientWriterOutput } from '@/types/agents'
import { EXERCISE_TYPE_FR, EXERCISE_LEVEL_FR } from '@/lib/i18n/exercises'

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
          <TabsTrigger value="raw">Données brutes</TabsTrigger>
        </TabsList>

        {/* Tab 1 — Protocole kiné */}
        <TabsContent value="protocol" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Objectifs de la phase</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {protocol.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-sky-500 mt-0.5">•</span> {obj}
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
                  <div key={key} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="font-medium text-sm">
                      {key === 'warmup' ? 'Échauffement' : key === 'main' ? 'Corps principal' : 'Retour au calme'}
                    </p>
                    <p className="text-xs text-slate-500">{sessionStructure[key]?.duration} min</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{sessionStructure[key]?.description}</p>
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
                      <div className="flex-1">
                        <p className="font-medium">{order}. {exercise.name}</p>
                        <p className="text-sm text-slate-500 mt-1">{exercise.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          {sets && <span>{sets} séries</span>}
                          {reps && <span>× {reps}</span>}
                          {rest && <span>Repos: {rest}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap ml-4">
                        <Badge variant="outline" className="text-xs">{EXERCISE_TYPE_FR[exercise.type]}</Badge>
                        <Badge variant="outline" className="text-xs">{EXERCISE_LEVEL_FR[exercise.level]}</Badge>
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

        {/* Tab 2 — Version patient */}
        <TabsContent value="patient">
          {patientVersion ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <a href={`/api/protocols/${protocol.id}/pdf`} download>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Exporter PDF patient
                  </Button>
                </a>
              </div>
              <Card>
                <CardHeader><CardTitle>{patientVersion.title}</CardTitle></CardHeader>
                <CardContent><p className="text-slate-600 dark:text-slate-400">{patientVersion.introduction}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Vos objectifs</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {patientVersion.objectives.map((obj, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-sky-500">•</span> {obj}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Vos exercices</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {patientVersion.exercises.map((ex, i) => (
                    <div key={i} className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border-l-4 border-sky-500">
                      <p className="font-medium">{i + 1}. {ex.name}</p>
                      <p className="text-sm text-sky-700 dark:text-sky-400 font-medium mt-1">{ex.sets}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{ex.howTo}</p>
                      <p className="text-xs text-slate-500 mt-2 italic">💡 {ex.tip}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              {patientVersion.importantWarnings.length > 0 && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <CardHeader><CardTitle className="text-base text-red-700 dark:text-red-400">Signes d&apos;alarme</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {patientVersion.importantWarnings.map((w, i) => (
                        <li key={i} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                          <span>⚠️</span> {w}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <CardContent className="pt-4">
                  <p className="text-sm text-green-700 dark:text-green-400">{patientVersion.motivationalClose}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-slate-500">Version patient non disponible.</p>
          )}
        </TabsContent>

        {/* Tab 3 — Données brutes */}
        <TabsContent value="raw">
          <Card>
            <CardHeader><CardTitle className="text-base">Output brut des agents (debug/audit)</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-auto max-h-[600px] whitespace-pre-wrap">
                {JSON.stringify(protocol.rawAgentOutput, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
