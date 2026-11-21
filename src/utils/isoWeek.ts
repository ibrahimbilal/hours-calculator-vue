/** Parse YYYY-MM-DD at local noon (avoids UTC date-shift). */
function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`)
}

/** Monday of the given ISO week-year / week number. */
export function mondayOfISOWeek(isoYear: number, isoWeek: number): Date {
  const jan4 = new Date(isoYear, 0, 4)
  const jan4Day = (jan4.getDay() + 6) % 7
  const week1Monday = new Date(isoYear, 0, 4 - jan4Day)
  const monday = new Date(week1Monday)
  monday.setDate(week1Monday.getDate() + (isoWeek - 1) * 7)
  return monday
}

/** ISO 8601 week-year and week number for a calendar date. */
export function isoWeekKey(dateStr: string): { week: number | null; year: number | null } {
  if (!dateStr) return { week: null, year: null }

  const date = parseLocalDate(dateStr)
  const thursday = new Date(date)
  thursday.setDate(date.getDate() - ((date.getDay() + 6) % 7) + 3)
  const isoYear = thursday.getFullYear()

  const jan4 = new Date(isoYear, 0, 4)
  const jan4Day = (jan4.getDay() + 6) % 7
  const week1Monday = new Date(isoYear, 0, 4 - jan4Day)

  const monday = new Date(date)
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))

  const isoWeek = 1 + Math.round((monday.getTime() - week1Monday.getTime()) / 604_800_000)
  return { week: isoWeek, year: isoYear }
}

export function formatISOWeekKey(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function weekKeyFromDate(dateStr: string): string {
  const { week, year } = isoWeekKey(dateStr)
  return week !== null && year !== null ? formatISOWeekKey(year, week) : 'no-date'
}

export function currentWeekKey(): string | null {
  const d = new Date()
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const { week, year } = isoWeekKey(date)
  return week !== null && year !== null ? formatISOWeekKey(year, week) : null
}

/** Short range label for a week group, e.g. "18 Nov – 24 Nov". */
export function isoWeekRangeLabel(weekKey: string, locale?: string): string {
  const match = weekKey.match(/^(\d+)-W(\d+)$/)
  if (!match) return ''
  const isoYear = Number(match[1])
  const isoWeek = Number(match[2])
  const monday = mondayOfISOWeek(isoYear, isoWeek)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

export function parseISOWeekKey(
  weekKey: string,
): { year: number; week: number } | null {
  const match = weekKey.match(/^(\d+)-W(\d+)$/)
  if (!match) return null
  return { year: Number(match[1]), week: Number(match[2]) }
}

/** Short year suffix for charts, e.g. 2026 → "26". */
export function shortYear(isoYear: number): string {
  return String(isoYear).slice(-2)
}