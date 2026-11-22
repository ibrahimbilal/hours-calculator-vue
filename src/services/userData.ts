import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { PersistedData } from '../types/calculator'
import { normalizeCurrencyCode } from '../utils/currency'
import { getFirebaseDb } from '../lib/firebase'

const PROFILE_COLLECTION = 'profile'

function normalizeExportedWeekSignatures(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object') return undefined
  const out: Record<string, string> = {}
  for (const [key, sig] of Object.entries(value)) {
    if (typeof key === 'string' && typeof sig === 'string' && sig) out[key] = sig
  }
  return Object.keys(out).length > 0 ? out : undefined
}

export async function loadUserData(uid: string): Promise<PersistedData | null> {
  const db = getFirebaseDb()
  if (!db) return null

  const snap = await getDoc(doc(db, 'users', uid, PROFILE_COLLECTION, 'data'))
  if (!snap.exists()) return null

  const data = snap.data()
  return {
    hourlyRate: typeof data.hourlyRate === 'number' ? data.hourlyRate : undefined,
    rows: Array.isArray(data.rows) ? data.rows : undefined,
    homeDateScope:
      data.homeDateScope === 'all' || data.homeDateScope === 'currentMonth'
        ? data.homeDateScope
        : undefined,
    currencyCode: data.currencyCode ? normalizeCurrencyCode(data.currencyCode) : undefined,
    exportedWeekSignatures: normalizeExportedWeekSignatures(data.exportedWeekSignatures),
    firstName: typeof data.firstName === 'string' ? data.firstName : undefined,
    lastName: typeof data.lastName === 'string' ? data.lastName : undefined,
  }
}

export async function saveUserData(uid: string, data: PersistedData): Promise<void> {
  const db = getFirebaseDb()
  if (!db) return

  await setDoc(
    doc(db, 'users', uid, PROFILE_COLLECTION, 'data'),
    {
      hourlyRate: data.hourlyRate ?? 0,
      rows: data.rows ?? [],
      homeDateScope: data.homeDateScope ?? 'currentMonth',
      currencyCode: data.currencyCode ?? 'EUR',
      exportedWeekSignatures: data.exportedWeekSignatures ?? {},
      firstName: data.firstName?.trim() ?? '',
      lastName: data.lastName?.trim() ?? '',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}