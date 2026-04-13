'use client'
import { useState, useCallback } from 'react'

export interface GenerateProtocolInput {
  pathologyId: string
  phaseId: string
  sins?: {
    severity: 'low' | 'medium' | 'high'
    irritability: 'low' | 'medium' | 'high'
    nature: 'mechanical' | 'inflammatory' | 'neuropathic'
  }
  stage?: 'acute' | 'subacute' | 'chronic'
  redFlagsCleared?: boolean
  patientProfile?: {
    age: number
    sex: 'M' | 'F'
    sport: string
    level: 'sedentary' | 'amateur' | 'competitive' | 'elite'
    objective: 'return_activity' | 'return_sport' | 'return_performance'
    sessionsPerWeek: number
    sessionDuration: 30 | 45 | 60
  }
  constraints?: string[]
  literatureContext?: string
}

export interface ProgressStep {
  step: number
  total: number
  message: string
}

export type GenerationStatus = 'idle' | 'generating' | 'saving' | 'done' | 'error'

export interface ProtocolGenerationState {
  status: GenerationStatus
  currentStep: ProgressStep | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protocol: any | null
  error: string | null
}

const INITIAL_STATE: ProtocolGenerationState = {
  status: 'idle',
  currentStep: null,
  protocol: null,
  error: null,
}

export function useProtocolGeneration() {
  const [state, setState] = useState<ProtocolGenerationState>(INITIAL_STATE)

  const reset = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  const generate = useCallback(async (input: GenerateProtocolInput) => {
    setState({ status: 'generating', currentStep: null, protocol: null, error: null })

    try {
      // Appel SSE vers la route Edge
      const res = await fetch('/api/generate-protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      // Erreur HTTP avant le stream (auth, billing, validation)
      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: 'Erreur réseau' }))
        const msg: string = json.error ?? 'Erreur lors de la génération'
        const code: string = json.upgradeUrl ? 'BILLING_LIMIT' : 'HTTP_ERROR'
        setState({ status: 'error', currentStep: null, protocol: null, error: msg })
        // On ré-expose les champs billing pour que le composant parent puisse les utiliser
        if (code === 'BILLING_LIMIT') {
          throw Object.assign(new Error(msg), { code, current: json.current, limit: json.limit, upgradeUrl: json.upgradeUrl })
        }
        throw new Error(msg)
      }

      if (!res.body) throw new Error('Stream indisponible')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let donePayload: any = null

      // Lecture du stream SSE ligne par ligne
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Garder la dernière ligne incomplète dans le buffer
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          let event: Record<string, unknown>
          try {
            event = JSON.parse(raw)
          } catch {
            continue
          }

          if (event.type === 'progress') {
            setState((prev) => ({
              ...prev,
              currentStep: {
                step: event.step as number,
                total: event.total as number,
                message: event.message as string,
              },
            }))
          } else if (event.type === 'done') {
            donePayload = event.protocol
          } else if (event.type === 'error') {
            throw Object.assign(new Error(event.message as string), { code: event.code })
          }
        }
      }

      if (!donePayload) throw new Error('Aucune donnée reçue du stream')

      // Sauvegarde en DB via la route Node.js
      setState((prev) => ({ ...prev, status: 'saving' }))

      const saveRes = await fetch('/api/save-protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donePayload),
      })

      const saveJson = await saveRes.json()

      if (!saveRes.ok || !saveJson.success) {
        const msg: string = saveJson.error ?? 'Erreur lors de la sauvegarde'
        setState({ status: 'error', currentStep: null, protocol: null, error: msg })
        throw new Error(msg)
      }

      setState({ status: 'done', currentStep: null, protocol: saveJson.protocol, error: null })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue'
      setState((prev) =>
        prev.status !== 'error'
          ? { status: 'error', currentStep: null, protocol: null, error: msg }
          : prev
      )
    }
  }, [])

  return { state, generate, reset }
}
