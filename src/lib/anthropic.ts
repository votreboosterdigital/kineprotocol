import Anthropic from '@anthropic-ai/sdk'

// Singleton — ne jamais instancier ailleurs
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const CLAUDE_MODEL = 'claude-opus-4-5' as const
