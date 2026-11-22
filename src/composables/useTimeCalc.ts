import { useI18n } from 'vue-i18n'
import type { TimeEntry } from '../types/calculator'
import { useCalculatorStore } from '../stores/calculator'
import { formatMoney } from '../utils/currency'

type TimeLike = Pick<TimeEntry, 'start' | 'end'>

export function parseTimeToMinutes(time: string): number | null {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time)) return null
  const [h, m] = time.split(':').map(Number)
  if (h! > 23 || m! > 59) return null
  return h! * 60 + m!
}

export function durationMinutes(row: TimeLike): number {
  const start = parseTimeToMinutes(row.start)
  const end = parseTimeToMinutes(row.end)
  if (start === null || end === null) return 0
  if (end >= start) return end - start
  return 1440 - start + end
}

export function hoursDecimal(row: TimeLike): number {
  return durationMinutes(row) / 60
}

export function formatDuration(mins: number, hLabel = 'h', mLabel = 'm'): string {
  const hours = Math.floor((mins || 0) / 60)
  const minutes = (mins || 0) % 60
  return `${hours}${hLabel} ${minutes}${mLabel}`
}

export function formatCurrency(value: number, symbol = ''): string {
  return formatMoney(value, symbol)
}

export function useTimeCalc() {
  const { t } = useI18n()
  const store = useCalculatorStore()

  function rowWarning(row: TimeLike): string {
    const start = parseTimeToMinutes(row.start)
    const end = parseTimeToMinutes(row.end)
    if (start === null || end === null) return ''
    if (start === end) return t('warnings.sameTime')
    if (durationMinutes(row) < 15) return t('warnings.shortShift')
    if (end < start) return t('warnings.overnight')
    return ''
  }

  function formatHM(mins: number): string {
    return formatDuration(mins, t('time.h'), t('time.m'))
  }

  function currency(value: number): string {
    return formatMoney(value, store.currencySymbol)
  }

  return {
    durationMinutes,
    hoursDecimal,
    formatHM,
    currency,
    rowWarning,
  }
}