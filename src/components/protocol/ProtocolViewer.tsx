'use client'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Download, ChevronDown, ChevronRight } from 'lucide-react'
import type { ProtocolWithRelations } from '@/types/database'
import type { PatientWriterOutput } from '@/types/agents'
import { EXERCISE_TYPE_FR, EXERCISE_LEVEL_FR } from '@/lib/i18n/exercises'

interface LiteratureReference {
  title: string
  authors: string
  year: number
  journal?: string
  pmid?: string | null
  url?: string
}

interface LiteratureCache {
  keyReferences?: LiteratureReference[]
  clinicalConsensus?: { summary?: string }
  openDebates?: Array<{ topic: string; position1: string; position2: string }>
  contraindications?: { absolute?: string[]; relative?: string[] }
  clinicalPearlsForProtocol?: string[]
}

interface ProtocolViewerProps {
  protocol: ProtocolWithRelations
  patientVersion: PatientWriterOutput | null
  literatureCache?: LiteratureCache | null
}

export function ProtocolViewer({ protocol, patientVersion, literatureCache }: ProtocolViewerProps) {
  const [refsOpen, setRefsOpen] = useState(false)

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
          {literatureCache && <TabsTrigger value="sources">🔬 Sources</TabsTrigger>}
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

        {/* Tab 3 — Sources cliniques (si disponibles) */}
        {literatureCache && (
          <TabsContent value="sources" className="space-y-4">
            {/* Accordéon — Base documentaire */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: '1px solid rgba(45,106,79,0.3)' }}
            >
              <button
                type="button"
                onClick={() => setRefsOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#2D6A4F]/5"
                style={{ background: 'rgba(45,106,79,0.06)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm" style={{ color: '#2D6A4F' }}>
                    Base documentaire de ce protocole
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(45,106,79,0.15)', color: '#2D6A4F' }}
                  >
                    {literatureCache.keyReferences?.length ?? 0} références
                  </span>
                </div>
                {refsOpen
                  ? <ChevronDown className="h-4 w-4" style={{ color: '#2D6A4F' }} />
                  : <ChevronRight className="h-4 w-4" style={{ color: '#2D6A4F' }} />
                }
              </button>

              {refsOpen && (
                <div className="px-5 pb-5 pt-4 space-y-4">
                  {literatureCache.clinicalConsensus?.summary && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {literatureCache.clinicalConsensus.summary}
                    </p>
                  )}
                  {(literatureCache.keyReferences?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      {literatureCache.keyReferences!.map((ref, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-lg"
                          style={{ background: 'rgba(45,106,79,0.04)', border: '1px solid rgba(45,106,79,0.12)' }}
                        >
                          <span
                            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                            style={{ background: 'rgba(45,106,79,0.15)', color: '#2D6A4F' }}
                          >
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            {ref.url ? (
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium leading-snug underline underline-offset-2 transition-colors"
                                style={{ color: '#2D6A4F' }}
                              >
                                {ref.title}
                              </a>
                            ) : (
                              <p className="text-sm font-medium leading-snug">{ref.title}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-0.5">
                              {ref.authors} — {ref.journal ?? ''} {ref.year}
                              {ref.pmid && (
                                <span className="ml-2 text-slate-400">PMID: {ref.pmid}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Débats ouverts */}
            {(literatureCache.openDebates?.length ?? 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base" style={{ color: '#2D6A4F' }}>Débats cliniques ouverts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {literatureCache.openDebates!.map((debate, i) => (
                    <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(45,106,79,0.04)', border: '1px solid rgba(45,106,79,0.12)' }}>
                      <p className="text-sm font-medium mb-2">{debate.topic}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded text-xs text-slate-600 dark:text-slate-300" style={{ background: 'rgba(45,106,79,0.06)' }}>
                          <span className="font-semibold block mb-1" style={{ color: '#2D6A4F' }}>Position A</span>
                          {debate.position1}
                        </div>
                        <div className="p-2 rounded text-xs text-slate-600 dark:text-slate-300" style={{ background: 'rgba(45,106,79,0.06)' }}>
                          <span className="font-semibold block mb-1" style={{ color: '#2D6A4F' }}>Position B</span>
                          {debate.position2}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Contre-indications documentées */}
            {(literatureCache.contraindications?.absolute?.length ?? 0) > 0 && (
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-base text-red-700 dark:text-red-400">Contre-indications documentées</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(literatureCache.contraindications?.absolute?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 mb-1">Absolues</p>
                      <ul className="space-y-1">
                        {literatureCache.contraindications!.absolute!.map((ci, i) => (
                          <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                            <span className="text-red-500">⚠</span> {ci}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(literatureCache.contraindications?.relative?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-600 mb-1">Relatives</p>
                      <ul className="space-y-1">
                        {literatureCache.contraindications!.relative!.map((ci, i) => (
                          <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                            <span className="text-amber-500">•</span> {ci}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Tab 4 — Données brutes */}
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
