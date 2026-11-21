import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { PersistedData } from '../types/calculator'
import { getFirebaseDb } from '../lib/firebase'

const PROFILE_COLLECTION = 'profile'

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
      firstName: data.firstName?.trim() ?? '',
      lastName: data.lastName?.trim() ?? '',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}