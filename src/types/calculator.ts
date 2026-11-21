export interface TimeEntry {
  id: string
  date: string
  start: string
  end: string
  price: number
}

/** Row used while adding a new entry (id optional until saved). */
export type DraftEntry = Omit<TimeEntry, 'id'> & { id?: string }

export interface AddRowPayload {
  date: string
  start: string
  end: string
  price?: number
}

import type { HomeDateScope } from '../utils/dateScope'

export interface PersistedData {
  rows?: Array<Partial<TimeEntry> & { id?: string }>
  hourlyRate?: number
  homeDateScope?: HomeDateScope
  firstName?: string
  lastName?: string
}

export type LocaleCode = 'ar' | 'en' | 'nl'