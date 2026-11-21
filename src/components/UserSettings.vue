<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, Eraser, Mail, User } from '@lucide/vue'
import { useAuthStore } from '../stores/auth'
import { useCalculatorStore } from '../stores/calculator'
import { useUserProfileStore } from '../stores/userProfile'
import GoogleLogo from './GoogleLogo.vue'
import {
  formatPersonName,
  getUserDisplayName,
  isEmailPasswordAccount,
  isGoogleAccount,
} from '../utils/authProfile'

const emit = defineEmits<{ back: [] }>()

const { t } = useI18n()
const auth = useAuthStore()
const store = useCalculatorStore()
const profile = useUserProfileStore()

const accountName = computed(() => {
  const u = auth.user
  if (!u) return ''
  return (
    getUserDisplayName(u, {
      firstName: profile.firstName,
      lastName: profile.lastName,
    }) || t('auth.signedIn')
  )
})

const accountEmail = computed(() => auth.user?.email?.trim() ?? '')

const usesGoogle = computed(() => {
  const u = auth.user
  return u ? isGoogleAccount(u) : false
})

const usesEmail = computed(() => {
  const u = auth.user
  return u ? isEmailPasswordAccount(u) : false
})

const saveHint = computed(() => {
  if (!auth.user) return t('summary.autoSaveLocal')
  switch (store.cloudSaveStatus) {
    case 'saving':
      return t('summary.autoSaveCloudSaving')
    case 'saved':
      return t('summary.autoSaveCloud')
    case 'error':
      return t('summary.autoSaveCloudError')
    default:
      return t('summary.autoSaveLocal')
  }
})

function clearAll() {
  if (confirm(`${t('actions.clearAll')}?`)) store.clearAll()
}
</script>

<template>
  <div class="space-y-4">
    <button
      type="button"
      class="flex items-center gap-1 text-sm font-semibold text-accent"
      @click="emit('back')"
    >
      <ChevronLeft class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
      {{ t('settings.back') }}
    </button>

    <div class="rounded-[1.25rem] border border-accent/10 bg-card px-4 py-5 shadow-summary-card">
      <h2 class="mb-4 text-lg font-semibold text-textc">{{ t('settings.title') }}</h2>

      <section v-if="auth.user" class="mb-6 border-b border-inputb pb-5">
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          {{ t('settings.account') }}
        </h3>

        <div class="mb-4 grid grid-cols-2 gap-2">
          <div>
            <label class="mb-1 block text-xs text-muted">{{ t('auth.firstName') }}</label>
            <input
              v-model="profile.firstName"
              type="text"
              autocomplete="given-name"
              class="w-full rounded-xl border border-inputb bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/35"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-muted">{{ t('auth.lastName') }}</label>
            <input
              v-model="profile.lastName"
              type="text"
              autocomplete="family-name"
              class="w-full rounded-xl border border-inputb bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/35"
            />
          </div>
        </div>
        <p v-if="usesGoogle" class="mb-3 text-[0.6875rem] text-muted">
          {{ t('settings.nameFromGoogle') }}
        </p>

        <div class="flex items-start gap-2 text-sm text-textc">
          <User class="mt-0.5 h-4 w-4 shrink-0 text-muted" :stroke-width="2" aria-hidden="true" />
          <span>
            <span class="block font-medium">
              {{ formatPersonName(profile) || accountName }}
            </span>
            <span
              v-if="accountEmail"
              class="mt-0.5 block break-all text-xs text-muted"
            >
              {{ accountEmail }}
            </span>
            <span
              v-if="usesGoogle"
              class="mt-2 inline-flex items-center gap-1.5 rounded-full border border-inputb bg-input/60 px-2 py-0.5 text-[0.6875rem] font-medium text-muted"
            >
              <GoogleLogo :size="14" />
              {{ t('settings.signedInWithGoogle') }}
            </span>
            <span
              v-else-if="usesEmail"
              class="mt-2 inline-flex items-center gap-1.5 rounded-full border border-inputb bg-input/60 px-2 py-0.5 text-[0.6875rem] font-medium text-muted"
            >
              <Mail class="h-3.5 w-3.5 shrink-0" :stroke-width="2" aria-hidden="true" />
              {{ t('settings.signedInWithEmail') }}
            </span>
          </span>
        </div>
      </section>

      <section class="mb-6">
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          {{ t('settings.workDefaults') }}
        </h3>
        <label class="mb-2 block text-xs text-muted">{{ t('summary.hourlyRate') }}</label>
        <input
          type="number"
          step="0.01"
          min="0"
          :value="store.hourlyRate"
          placeholder="0"
          class="w-full rounded-xl border border-inputb bg-input px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/35"
          @input="
            store.hourlyRate = parseFloat(($event.target as HTMLInputElement).value) || 0
          "
        />
        <p class="mt-2 text-[0.6875rem] text-muted">{{ t('summary.hourlyRateHint') }}</p>
      </section>

      <section class="mb-4">
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          {{ t('settings.data') }}
        </h3>
        <p class="mb-3 text-[0.6875rem] text-muted">{{ saveHint }}</p>
        <button
          type="button"
          class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-inputb bg-transparent px-4 py-2.5 text-[0.8125rem] font-semibold text-red-700"
          @click="clearAll"
        >
          <Eraser class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
          {{ t('actions.clearAll') }}
        </button>
      </section>
    </div>
  </div>
</template>