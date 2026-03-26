export function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `il y a ${days} j`
  if (hours > 0) return `il y a ${hours} h`
  if (minutes > 0) return `il y a ${minutes} min`
  return "à l'instant"
}
