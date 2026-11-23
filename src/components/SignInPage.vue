<script setup lang="ts">
import { ref } from 'vue'
import { meetsSignUpPasswordRules } from '../utils/passwordStrength'
import PasswordStrength from './PasswordStrength.vue'
import { useI18n } from 'vue-i18n'
import { Clock, Eye, EyeOff } from '@lucide/vue'
import { useAuthStore } from '../stores/auth'
import GoogleLogo from './GoogleLogo.vue'
import LangSwitcher from './LangSwitcher.vue'

const { t } = useI18n()
const auth = useAuthStore()

const mode = ref<'signIn' | 'signUp'>('signIn')
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const busy = ref(false)
const localError = ref<string | null>(null)

function authErrorMessage(err: unknown): string {
  const code =
    typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : ''
  return t(`auth.errors.${code}`, t('auth.errors.default'))
}

async function withBusy(action: () => Promise<void>) {
  busy.value = true
  localError.value = null
  auth.setAuthError(null)
  try {
    await action()
  } catch (err: unknown) {
    localError.value = authErrorMessage(err)
  } finally {
    busy.value = false
  }
}

function submitEmail() {
  if (!email.value.trim()) {
    localError.value = t('auth.errors.default')
    return
  }
  if (mode.value === 'signUp') {
    if (!firstName.value.trim()) {
      localError.value = t('auth.errors.firstNameRequired')
      return
    }
    if (!meetsSignUpPasswordRules(password.value)) {
      localError.value = t('auth.errors.passwordRules')
      return
    }
  } else if (password.value.length < 6) {
    localError.value = t('auth.errors.weakPassword')
    return
  }
  void withBusy(() =>
    mode.value === 'signIn'
      ? auth.signInWithEmail(email.value, password.value)
      : auth.signUpWithEmail(
          email.value,
          password.value,
          firstName.value,
          lastName.value,
        ),
  )
}

function googleSignIn() {
  void withBusy(() => auth.signInWithGoogle())
}
</script>

<template>
  <div
    class="flex min-h-dvh flex-col bg-gradient-to-b from-sky-50 via-[#e8f4f8] to-slate-50"
  >
    <header
      class="flex items-center justify-between gap-3 border-b border-inputb bg-sky-50/95 px-4 py-3 backdrop-blur-sm ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]"
    >
      <div class="m-0 min-w-0 flex items-center gap-2 flex-1">
        <img src="/icons/favicon.png" :alt="t('app.title')" class="size-10 rounded-full" width="40" height="40" />
        <div class="m-0 min-w-0 flex-1 truncate text-lg font-semibold text-accent">
          {{ t('app.title') }}
        </div>
      </div>
      <LangSwitcher />
    </header>

    <main
      class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8 ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]"
    >
      <div
        class="rounded-[1.25rem] border border-accent/10 bg-card px-5 py-6 shadow-summary-card"
      >
        <div class="mb-4 flex items-center gap-3">
          <div
            class="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent"
            aria-hidden="true"
          >
            <Clock class="h-6 w-6" :stroke-width="2" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-textc">{{ t('auth.pageTitle') }}</h2>
            <p class="text-[0.8125rem] leading-snug text-muted">{{ t('auth.pageSubtitle') }}</p>
          </div>
        </div>

        <div class="mb-4 flex gap-1 rounded-xl bg-input p-1">
          <button
            type="button"
            class="flex-1 rounded-lg px-2 py-2 text-sm font-semibold"
            :class="mode === 'signIn' ? 'bg-card text-accent shadow-sm' : 'text-muted'"
            @click="mode = 'signIn'"
          >
            {{ t('auth.signIn') }}
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg px-2 py-2 text-sm font-semibold"
            :class="mode === 'signUp' ? 'bg-card text-accent shadow-sm' : 'text-muted'"
            @click="mode = 'signUp'"
          >
            {{ t('auth.signUp') }}
          </button>
        </div>

        <template v-if="mode === 'signUp'">
          <div class="mb-3 grid grid-cols-2 gap-2">
            <div>
              <label class="mb-1 block text-xs text-muted">{{ t('auth.firstName') }}</label>
              <input
                v-model="firstName"
                type="text"
                autocomplete="given-name"
                class="w-full rounded-xl border border-inputb bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/35"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-muted">{{ t('auth.lastName') }}</label>
              <input
                v-model="lastName"
                type="text"
                autocomplete="family-name"
                class="w-full rounded-xl border border-inputb bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/35"
              />
            </div>
          </div>
        </template>

        <label class="mb-1 block text-xs text-muted">{{ t('auth.email') }}</label>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          class="mb-3 w-full rounded-xl border border-inputb bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/35"
          @keyup.enter="submitEmail"
        />

        <label class="mb-1 block text-xs text-muted">{{ t('auth.password') }}</label>
        <div class="relative" :class="mode === 'signUp' ? 'mb-3' : 'mb-4'">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="mode === 'signUp' ? 'new-password' : 'current-password'"
            class="w-full rounded-xl border border-inputb bg-input py-2.5 pe-11 ps-3 text-sm outline-none focus:ring-2 focus:ring-accent/35"
            @keyup.enter="submitEmail"
          />
          <button
            type="button"
            class="absolute end-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-1.5 text-muted transition-colors hover:text-accent"
            :aria-label="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
          >
            <Eye v-if="showPassword" class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
            <EyeOff v-else class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
          </button>
        </div>

        <PasswordStrength v-if="mode === 'signUp'" :password="password" />

        <p v-if="localError" class="mb-3 text-sm text-red-600" role="alert">{{ localError }}</p>

        <button
          type="button"
          class="mb-3 w-full rounded-xl bg-accent px-3 py-3 text-sm font-semibold text-white disabled:opacity-60"
          :disabled="busy || !auth.ready"
          @click="submitEmail"
        >
          {{ mode === 'signIn' ? t('auth.signIn') : t('auth.signUp') }}
        </button>

        <button
          type="button"
          class="flex w-full items-center justify-center gap-2.5 rounded-xl border border-inputb bg-white px-3 py-3 text-sm font-semibold text-textc shadow-sm disabled:opacity-60"
          :disabled="busy || !auth.ready"
          @click="googleSignIn"
        >
          <GoogleLogo :size="20" />
          {{ t('auth.google') }}
        </button>
      </div>

      <p class="mt-4 text-center text-[0.75rem] leading-relaxed text-muted">
        {{ t('auth.signInRequired') }}
        ·
        <a href="/home" class="text-accent hover:underline">{{ t('home.title') }}</a>
        ·
        <a href="/privacy" class="text-accent hover:underline">{{ t('privacy.title') }}</a>
      </p>
    </main>
  </div>
</template>