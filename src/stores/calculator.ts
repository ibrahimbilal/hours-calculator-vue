import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { randomId } from '../utils/id'
import type { AddRowPayload, PersistedData, TimeEntry } from '../types/calculator'

const STORAGE_KEY = 'hours-calc-data'

function createRow(start = '', end = '', date = '', price = 0): TimeEntry {
  return { id: randomId(8), date, start, end, price }
}

function loadSaved(): PersistedData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedData) : null
  } catch {
    return null
  }
}

export const useCalculatorStore = defineStore('calculator', () => {
  const saved = loadSaved()
  const defaultRate = typeof saved?.hourlyRate === 'number' ? saved.hourlyRate : 15

  function today(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const rows = ref<TimeEntry[]>(
    saved?.rows?.length
      ? saved.rows.map((row) => ({
          id: row.id || randomId(8),
          date: row.date || '',
          start: row.start || '',
          end: row.end || '',
          price:
            typeof row.price === 'number'
              ? row.price
              : typeof saved?.hourlyRate === 'number'
                ? saved.hourlyRate
                : 15,
        }))
      : [createRow('', '', today(), defaultRate)],
  )

  const hourlyRate = ref(typeof saved?.hourlyRate === 'number' ? saved.hourlyRate : 15)

  function addRow(): void {
    rows.value.push(createRow('', '', '', hourlyRate.value))
  }

  function addRowWithDate(date: string): void {
    rows.value.push(createRow('', '', date, hourlyRate.value))
  }

  function addRowFull({ date, start, end, price }: AddRowPayload): void {
    rows.value.push(
      createRow(start, end, date, typeof price === 'number' ? price : hourlyRate.value),
    )
  }

  function removeRow(index: number): void {
    rows.value.splice(index, 1)
    if (rows.value.length === 0) {
      rows.value = [createRow('', '', today(), hourlyRate.value)]
    }
  }

  function clearAll(): void {
    rows.value = [createRow('', '', today(), 0)]
    hourlyRate.value = 0
  }

  function isBlankRow(row: TimeEntry): boolean {
    return !row.start && !row.end && !row.date
  }

  function importEntries(entries: AddRowPayload[], mode: 'merge' | 'replace'): number {
    const imported = entries.map((entry) =>
      createRow(
        entry.start,
        entry.end,
        entry.date,
        typeof entry.price === 'number' ? entry.price : hourlyRate.value,
      ),
    )
    if (mode === 'replace') {
      rows.value =
        imported.length > 0 ? imported : [createRow('', '', today(), hourlyRate.value)]
      return imported.length
    }

    const base =
      rows.value.length === 1 && isBlankRow(rows.value[0]!) ? [] : [...rows.value]
    rows.value = base.length || imported.length ? [...base, ...imported] : [createRow('', '', today(), hourlyRate.value)]
    return imported.length
  }

  function persist(): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ rows: rows.value, hourlyRate: hourlyRate.value }),
    )
  }

  watch([rows, hourlyRate], persist, { deep: true })

  return {
    rows,
    hourlyRate,
    today,
    addRow,
    addRowWithDate,
    addRowFull,
    removeRow,
    clearAll,
    importEntries,
  }
})