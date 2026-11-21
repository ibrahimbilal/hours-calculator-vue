export type HomeDateScope = 'currentMonth' | 'all'

export function isInCurrentMonth(date: string, ref = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})/.exec(date.trim())
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  return year === ref.getFullYear() && month === ref.getMonth() + 1
}

export function normalizeHomeDateScope(value: unknown): HomeDateScope {
  return value === 'all' ? 'all' : 'currentMonth'
}