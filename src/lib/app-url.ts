/**
 * Dérive l'URL de base de l'application depuis la requête HTTP.
 * Fallback : variable d'env, puis localhost pour le dev.
 */
export function getAppUrl(req: Request): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  if (host) return `${proto}://${host}`
  return process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
}
