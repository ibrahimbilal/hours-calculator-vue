import type { AddRowPayload } from '../types/calculator'
import { durationMinutes, formatCurrency, hoursDecimal } from '../composables/useTimeCalc'
import type { TimeEntry } from '../types/calculator'
import { weekKeyFromDate } from './isoWeek'

export type IsoWeekRowGroup = { weekKey: string; rows: TimeEntry[] }

/** Group rows by ISO week key (e.g. 2026-W45), oldest week first. */
export function groupRowsByIsoWeek(rows: TimeEntry[]): IsoWeekRowGroup[] {
  const map = new Map<string, TimeEntry[]>()
  for (const row of rows) {
    const key = weekKeyFromDate(row.date || '')
    const list = map.get(key) ?? []
    list.push(row)
    map.set(key, list)
  }
  const keys = [...map.keys()].sort((a, b) => {
    if (a === 'no-date') return 1
    if (b === 'no-date') return -1
    const [yA, wA] = a.split('-W').map(Number)
    const [yB, wB] = b.split('-W').map(Number)
    if (yA !== yB) return yA - yB
    return wA - wB
  })
  return keys.map((weekKey) => ({ weekKey, rows: map.get(weekKey)! }))
}

export function escapeCsvField(value: string | number): string {
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function buildExportCsv(
  rows: TimeEntry[],
  hourlyRate: number,
  headerLabels: [string, string, string, string, string],
  currencySymbol: string,
): string {
  const header = headerLabels.join(',')
  const lines = rows.map((row) => {
    const hours = (durationMinutes(row) / 60).toFixed(2)
    const pay = formatCurrency(
      hoursDecimal(row) * (row.price ?? hourlyRate),
      currencySymbol,
    )
    return [
      escapeCsvField(row.date || ''),
      escapeCsvField(row.start || ''),
      escapeCsvField(row.end || ''),
      escapeCsvField(hours),
      escapeCsvField(pay),
    ].join(',')
  })
  return [header, ...lines].join('\n')
}

export function downloadCsvFile(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** RFC 4180-style CSV parse (comma-separated, quoted fields). */
export function parseCsvRecords(text: string): string[][] {
  const records: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushRow = () => {
    row.push(field)
    if (row.some((cell) => cell.trim() !== '')) {
      records.push(row)
    }
    row = []
    field = ''
  }

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        inQuotes = false
      } else {
        field += c
      }
      continue
    }

    if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      pushRow()
    } else if (c === '\r') {
      if (next === '\n') i++
      pushRow()
    } else {
      field += c
    }
  }

  if (field.length > 0 || row.length > 0) {
    pushRow()
  }

  return records
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{1,2}:\d{2}$/

function normalizeTime(time: string): string {
  const t = time.trim()
  if (!TIME_RE.test(t)) return ''
  const [h, m] = t.split(':')
  return `${String(Number(h)).padStart(2, '0')}:${m}`
}

function isLikelyHeaderRow(cells: string[]): boolean {
  const first = cells[0]?.trim() ?? ''
  return !DATE_RE.test(first)
}

const PAY_HEADER_NAMES = new Set(['pay', 'loon', 'الأجر', 'betaald', 'paid'])

function payColumnIndex(headers: string[] | undefined, cellCount: number): number {
  if (headers?.length) {
    const idx = headers.findIndex((h) => PAY_HEADER_NAMES.has(h.trim().toLowerCase()))
    if (idx >= 0) return idx
  }
  if (cellCount >= 5) return 4
  return -1
}

function parseAmountField(raw: string): number | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  const normalized = trimmed.replace(/[^\d.,-]/g, '').replace(',', '.')
  const value = Number.parseFloat(normalized)
  return Number.isFinite(value) ? value : undefined
}

/** Total pay from CSV → hourly rate stored on each row. */
function hourlyRateFromPay(payTotal: number, start: string, end: string): number | undefined {
  const hours = hoursDecimal({ start, end })
  if (hours <= 0) return undefined
  return payTotal / hours
}

export type CsvImportResult = {
  entries: AddRowPayload[]
  errors: string[]
  skippedHeader: boolean
}

export function entriesFromCsv(
  text: string,
  invalidRowMessage: (line: number) => string,
): CsvImportResult {
  const records = parseCsvRecords(text.trim())
  const errors: string[] = []
  const entries: AddRowPayload[] = []

  if (records.length === 0) {
    return { entries, errors: ['empty'], skippedHeader: false }
  }

  let startIndex = 0
  let skippedHeader = false
  let headerCells: string[] | undefined
  if (isLikelyHeaderRow(records[0]!)) {
    headerCells = records[0]
    startIndex = 1
    skippedHeader = true
  }

  for (let i = startIndex; i < records.length; i++) {
    const cells = records[i]!
    const lineNum = i + 1
    const date = cells[0]?.trim() ?? ''
    const start = normalizeTime(cells[1] ?? '')
    const end = normalizeTime(cells[2] ?? '')

    if (!date && !start && !end) continue

    if (!DATE_RE.test(date) || !start || !end) {
      errors.push(invalidRowMessage(lineNum))
      continue
    }

    const payIdx = payColumnIndex(headerCells, cells.length)
    const payRaw = payIdx >= 0 ? cells[payIdx] : undefined
    const payTotal = payRaw !== undefined ? parseAmountField(payRaw) : undefined
    const price =
      payTotal !== undefined ? hourlyRateFromPay(payTotal, start, end) : undefined

    entries.push({ date, start, end, ...(price !== undefined ? { price } : {}) })
  }

  return { entries, errors, skippedHeader }
}