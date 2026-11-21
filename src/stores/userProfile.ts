import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { saveUserData } from '../services/userData'
import { useCalculatorStore } from './calculator'

const CLOUD_SAVE_DEBOUNCE_MS = 1500

function trimName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export const useUserProfileStore = defineStore('userProfile', () => {
  const firstName = ref('')
  const lastName = ref('')
  const cloudUserId = ref<string | null>(null)
  let skipCloudSave = false
  let cloudSaveTimer: ReturnType<typeof setTimeout> | null = null

  function setNames(next: { firstName?: string; lastName?: string }): void {
    if (typeof next.firstName === 'string') firstName.value = trimName(next.firstName)
    if (typeof next.lastName === 'string') lastName.value = trimName(next.lastName)
  }

  function applyRemote(data: { firstName?: string; lastName?: string } | null | undefined): void {
    skipCloudSave = true
    firstName.value = typeof data?.firstName === 'string' ? trimName(data.firstName) : ''
    lastName.value = typeof data?.lastName === 'string' ? trimName(data.lastName) : ''
    skipCloudSave = false
  }

  function hasStoredNames(): boolean {
    return Boolean(firstName.value.trim() || lastName.value.trim())
  }

  function setCloudUser(uid: string | null): void {
    cloudUserId.value = uid
    if (!uid && cloudSaveTimer) {
      clearTimeout(cloudSaveTimer)
      cloudSaveTimer = null
    }
  }

  function resetForSignOut(): void {
    skipCloudSave = true
    if (cloudSaveTimer) {
      clearTimeout(cloudSaveTimer)
      cloudSaveTimer = null
    }
    cloudUserId.value = null
    firstName.value = ''
    lastName.value = ''
    skipCloudSave = false
  }

  function scheduleCloudSave(): void {
    const uid = cloudUserId.value
    if (!uid || skipCloudSave) return

    if (cloudSaveTimer) clearTimeout(cloudSaveTimer)
    cloudSaveTimer = setTimeout(() => {
      cloudSaveTimer = null
      const calculator = useCalculatorStore()
      void saveUserData(uid, {
        ...calculator.getPersistedSnapshot(),
        firstName: firstName.value,
        lastName: lastName.value,
      }).catch((err) => {
        console.error('[userProfile] Cloud save failed', err)
        calculator.setCloudError()
      })
    }, CLOUD_SAVE_DEBOUNCE_MS)
  }

  watch([firstName, lastName], scheduleCloudSave)

  return {
    firstName,
    lastName,
    setNames,
    applyRemote,
    hasStoredNames,
    setCloudUser,
    resetForSignOut,
  }
})