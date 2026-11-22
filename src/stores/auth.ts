import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from '../lib/firebase'
import { extractGoogleNames, isGoogleAccount } from '../utils/authProfile'
import { loadUserData, saveUserData } from '../services/userData'
import { useCalculatorStore } from './calculator'
import { useUserProfileStore } from './userProfile'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const ready = ref(false)
  const authError = ref<string | null>(null)
  let unsub: (() => void) | null = null
  let pendingSignUpNames: { firstName: string; lastName: string } | null = null

  async function persistCloudSnapshot(uid: string): Promise<void> {
    const calculator = useCalculatorStore()
    const profile = useUserProfileStore()
    await saveUserData(uid, {
      ...calculator.getPersistedSnapshot(),
      firstName: profile.firstName,
      lastName: profile.lastName,
    })
    calculator.markCloudSaved()
  }

  async function handleSignedIn(signedIn: User) {
    const calculator = useCalculatorStore()
    const profile = useUserProfileStore()
    calculator.setCloudUser(signedIn.uid)
    profile.setCloudUser(signedIn.uid)

    const pendingNames = pendingSignUpNames
    pendingSignUpNames = null

    try {
      const remote = await loadUserData(signedIn.uid)
      const hasCalculatorData =
        Boolean(remote?.rows?.length) || typeof remote?.hourlyRate === 'number'

      if (hasCalculatorData && remote) {
        calculator.applyRemoteData(remote)
      } else {
        calculator.bootstrapFromLocalIfAny()
      }

      profile.applyRemote(remote)

      let shouldPersistProfile = false
      if (pendingNames) {
        profile.setNames(pendingNames)
        shouldPersistProfile = true
      } else if (!profile.hasStoredNames() && isGoogleAccount(signedIn)) {
        profile.setNames(extractGoogleNames(signedIn))
        shouldPersistProfile = true
      }

      if (!remote || !hasCalculatorData || shouldPersistProfile) {
        await persistCloudSnapshot(signedIn.uid)
      }
    } catch (err) {
      console.error('[auth] Failed to load cloud data', err)
      calculator.setCloudError()
    }
  }

  function initAuth(): void {
    const auth = getFirebaseAuth()
    if (!auth) {
      ready.value = true
      return
    }
    if (unsub) return

    unsub = onAuthStateChanged(auth, async (next) => {
      user.value = next
      authError.value = null

      if (next) {
        await handleSignedIn(next)
      } else {
        useCalculatorStore().resetForSignOut()
        useUserProfileStore().resetForSignOut()
      }

      ready.value = true
    })
  }

  async function signInWithEmail(email: string, password: string): Promise<void> {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error('Firebase not configured')
    authError.value = null
    pendingSignUpNames = null
    await signInWithEmailAndPassword(auth, email.trim(), password)
  }

  async function signUpWithEmail(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<void> {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error('Firebase not configured')
    authError.value = null
    pendingSignUpNames = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    }
    await createUserWithEmailAndPassword(auth, email.trim(), password)
  }

  async function signInWithGoogle(): Promise<void> {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error('Firebase not configured')
    authError.value = null
    pendingSignUpNames = null
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  async function signOutUser(): Promise<void> {
    const auth = getFirebaseAuth()
    if (!auth) return
    authError.value = null
    pendingSignUpNames = null
    await signOut(auth)
  }

  function setAuthError(message: string | null): void {
    authError.value = message
  }

  return {
    user,
    ready,
    authError,
    initAuth,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOutUser,
    setAuthError,
  }
})