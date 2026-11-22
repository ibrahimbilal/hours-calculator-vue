import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { randomId } from '../utils/id'
import { isFirebaseConfigured } from '../lib/firebase'
import { saveUserData } from '../services/userData'
import {
  DEFAULT_CURRENCY_CODE,
  type CurrencyCode,
  currencySymbolFor,
  normalizeCurrencyCode,
} from '../utils/currency'
import {
  type HomeDateScope,
  isInCurrentMonth,
  normalizeHomeDateScope,
} from '../utils/dateScope'
import type { AddRowPayload, PersistedData, TimeEntry } from '../types/calculator'

const STORAGE_KEY = 'hours-calc-data'
const CLOUD_SAVE_DEBOUNCE_MS = 1500

export type CloudSaveStatus = 'local' | 'saving' | 'saved' | 'error'

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

function normalizeExportedWeekSignatures(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [key, sig] of Object.entries(value)) {
    if (typeof key === 'string' && typeof sig === 'string' && sig) out[key] = sig
  }
  return out
}

function normalizeRows(data: PersistedData, fallbackRate: number): TimeEntry[] {
  if (!data.rows?.length) {
    return []
  }
  return data.rows.map((row) => ({
    id: row.id || randomId(8),
    date: row.date || '',
    start: row.start || '',
    end: row.end || '',
    price:
      typeof row.price === 'number'
        ? row.price
        : typeof data.hourlyRate === 'number'
          ? data.hourlyRate
          : fallbackRate,
  }))
}

export const useCalculatorStore = defineStore('calculator', () => {
  const saved = isFirebaseConfigured() ? null : loadSaved()
  const defaultRate = typeof saved?.hourlyRate === 'number' ? saved.hourlyRate : 15

  function today(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const rows = ref<TimeEntry[]>(
    saved?.rows?.length
      ? normalizeRows(saved, defaultRate)
      : [createRow('', '', today(), defaultRate)],
  )

  const hourlyRate = ref(typeof saved?.hourlyRate === 'number' ? saved.hourlyRate : 15)

  const homeDateScope = ref<HomeDateScope>(normalizeHomeDateScope(saved?.homeDateScope))

  const exportedWeekSignatures = ref<Record<string, string>>(
    normalizeExportedWeekSignatures(saved?.exportedWeekSignatures),
  )

  const currencyCode = ref<CurrencyCode>(normalizeCurrencyCode(saved?.currencyCode))

  const currencySymbol = computed(() => currencySymbolFor(currencyCode.value))

  const homeDisplayRows = computed(() => {
    if (homeDateScope.value === 'all') return rows.value
    return rows.value.filter((row) => isInCurrentMonth(row.date))
  })

  const cloudUserId = ref<string | null>(null)
  const cloudSaveStatus = ref<CloudSaveStatus>('local')
  let skipCloudSave = false
  let cloudSaveTimer: ReturnType<typeof setTimeout> | null = null

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

  function getPersistedSnapshot(): PersistedData {
    return {
      rows: rows.value.map((row) => ({ ...row })),
      hourlyRate: hourlyRate.value,
      homeDateScope: homeDateScope.value,
      currencyCode: currencyCode.value,
      exportedWeekSignatures: { ...exportedWeekSignatures.value },
    }
  }

  function setCurrencyCode(code: CurrencyCode): void {
    currencyCode.value = normalizeCurrencyCode(code)
  }

  function patchExportedWeekSignatures(patch: Record<string, string>): void {
    exportedWeekSignatures.value = { ...exportedWeekSignatures.value, ...patch }
  }

  function setHomeDateScope(scope: HomeDateScope): void {
    homeDateScope.value = scope
  }

  function rowVisibleOnHome(row: TimeEntry): boolean {
    if (homeDateScope.value === 'all') return true
    return isInCurrentMonth(row.date)
  }

  function applyRemoteData(data: PersistedData): void {
    skipCloudSave = true
    const rate = typeof data.hourlyRate === 'number' ? data.hourlyRate : hourlyRate.value
    const normalized = normalizeRows(data, rate)
    if (normalized.length) {
      rows.value = normalized
    }
    hourlyRate.value = rate
    if (data.homeDateScope === 'all' || data.homeDateScope === 'currentMonth') {
      homeDateScope.value = data.homeDateScope
    }
    if (data.exportedWeekSignatures !== undefined) {
      exportedWeekSignatures.value = normalizeExportedWeekSignatures(
        data.exportedWeekSignatures,
      )
    }
    if (data.currencyCode !== undefined) {
      currencyCode.value = normalizeCurrencyCode(data.currencyCode)
    }
    persist()
    skipCloudSave = false
    markCloudSaved()
  }

  function setCloudUser(uid: string | null): void {
    cloudUserId.value = uid
    if (!uid) {
      cloudSaveStatus.value = 'local'
      if (cloudSaveTimer) {
        clearTimeout(cloudSaveTimer)
        cloudSaveTimer = null
      }
    }
  }

  function bootstrapFromLocalIfAny(): void {
    const local = loadSaved()
    if (local?.rows?.length || typeof local?.hourlyRate === 'number') {
      applyRemoteData(local)
    }
  }

  function resetForSignOut(): void {
    skipCloudSave = true
    if (cloudSaveTimer) {
      clearTimeout(cloudSaveTimer)
      cloudSaveTimer = null
    }
    cloudUserId.value = null
    cloudSaveStatus.value = 'local'
    rows.value = [createRow('', '', today(), 15)]
    hourlyRate.value = 15
    exportedWeekSignatures.value = {}
    currencyCode.value = DEFAULT_CURRENCY_CODE
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    skipCloudSave = false
  }

  function markCloudSaved(): void {
    if (cloudUserId.value) cloudSaveStatus.value = 'saved'
  }

  function setCloudError(): void {
    if (cloudUserId.value) cloudSaveStatus.value = 'error'
  }

  function scheduleCloudSave(): void {
    const uid = cloudUserId.value
    if (!uid || skipCloudSave) return

    if (cloudSaveTimer) clearTimeout(cloudSaveTimer)
    cloudSaveStatus.value = 'saving'

    cloudSaveTimer = setTimeout(() => {
      cloudSaveTimer = null
      void saveUserData(uid, getPersistedSnapshot())
        .then(() => {
          if (cloudUserId.value === uid) cloudSaveStatus.value = 'saved'
        })
        .catch((err) => {
          console.error('[calculator] Cloud save failed', err)
          if (cloudUserId.value === uid) cloudSaveStatus.value = 'error'
        })
    }, CLOUD_SAVE_DEBOUNCE_MS)
  }

  function persist(): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        rows: rows.value,
        hourlyRate: hourlyRate.value,
        homeDateScope: homeDateScope.value,
        currencyCode: currencyCode.value,
        exportedWeekSignatures: exportedWeekSignatures.value,
      }),
    )
    scheduleCloudSave()
  }

  watch(
    [rows, hourlyRate, homeDateScope, currencyCode, exportedWeekSignatures],
    persist,
    { deep: true },
  )

  return {
    rows,
    hourlyRate,
    homeDateScope,
    currencyCode,
    currencySymbol,
    exportedWeekSignatures,
    homeDisplayRows,
    cloudSaveStatus,
    today,
    addRow,
    addRowWithDate,
    addRowFull,
    removeRow,
    clearAll,
    importEntries,
    setHomeDateScope,
    setCurrencyCode,
    patchExportedWeekSignatures,
    rowVisibleOnHome,
    getPersistedSnapshot,
    applyRemoteData,
    setCloudUser,
    markCloudSaved,
    setCloudError,
    bootstrapFromLocalIfAny,
    resetForSignOut,
  }
})