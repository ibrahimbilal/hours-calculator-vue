import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

function readConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
}

function configReady(config: ReturnType<typeof readConfig>): boolean {
  return Boolean(
    config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.appId,
  )
}

let app: FirebaseApp | null = null

export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app
  const config = readConfig()
  if (!configReady(config)) {
    console.warn('[firebase] Missing VITE_FIREBASE_* env vars — cloud sync disabled.')
    return null
  }
  app = initializeApp(config)
  return app
}

export function getFirebaseAuth() {
  const firebaseApp = getFirebaseApp()
  return firebaseApp ? getAuth(firebaseApp) : null
}

export function getFirebaseDb() {
  const firebaseApp = getFirebaseApp()
  return firebaseApp ? getFirestore(firebaseApp) : null
}

export function isFirebaseConfigured(): boolean {
  return configReady(readConfig())
}