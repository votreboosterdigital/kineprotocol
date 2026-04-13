/**
 * Utilitaire de retry exponentiel pour les appels LLM
 * Utilisé par les 3 agents de génération de protocole
 */
export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxAttempts) throw error
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max attempts reached')
}
