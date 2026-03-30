import Anthropic from '@anthropic-ai/sdk'

// Lazy factory — instanciation différée au premier appel
let _client: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

// Alias pour la compatibilité avec les agents existants
export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    return (getAnthropic() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const CLAUDE_MODEL = 'claude-opus-4-5' as const
