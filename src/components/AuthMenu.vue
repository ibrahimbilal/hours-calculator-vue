<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LogOut, Settings, User } from '@lucide/vue'
import { useAuthStore } from '../stores/auth'
import { useCalculatorStore } from '../stores/calculator'
import { useUserProfileStore } from '../stores/userProfile'
import type { HomeDateScope } from '../utils/dateScope'
import { isFirebaseConfigured } from '../lib/firebase'
import { getUserDisplayName } from '../utils/authProfile'

const emit = defineEmits<{ openSettings: [] }>()

const { t } = useI18n()
const auth = useAuthStore()
const store = useCalculatorStore()
const profile = useUserProfileStore()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const userLabel = computed(() => {
  const u = auth.user
  if (!u) return ''
  return (
    getUserDisplayName(u, {
      firstName: profile.firstName,
      lastName: profile.lastName,
    }) || t('auth.signedIn')
  )
})

const userTitle = computed(() => {
  const u = auth.user
  if (!u) return ''
  const name = getUserDisplayName(u, {
    firstName: profile.firstName,
    lastName: profile.lastName,
  })
  const email = u.email?.trim()
  if (name && email && name !== email) return `${name} (${email})`
  return name || email || ''
})

const showAccount = computed(() => isFirebaseConfigured() && Boolean(auth.user))

function onDocClick(event: MouseEvent) {
  const target = event.target
  if (root.value && target instanceof Node && !root.value.contains(target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

function toggleOpen() {
  open.value = !open.value
}

function openSettings() {
  open.value = false
  emit('openSettings')
}

function signOut() {
  open.value = false
  if (confirm(t('auth.signOutConfirm'))) {
    void auth.signOutUser()
  }
}

function setHomeScope(scope: HomeDateScope) {
  store.setHomeDateScope(scope)
}
</script>

<template>
  <div ref="root" class="relative shrink-0">
    <button
      v-if="showAccount"
      type="button"
      class="flex max-w-[9rem] items-center gap-1.5 rounded-lg border border-accent/20 bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent sm:max-w-[12rem]"
      :title="userTitle"
      :aria-expanded="open"
      @click.stop="toggleOpen"
    >
      <User class="h-3.5 w-3.5 shrink-0" :stroke-width="2" aria-hidden="true" />
      <span class="truncate">{{ userLabel }}</span>
    </button>

    <button
      v-else
      type="button"
      class="flex items-center gap-1.5 rounded-xl border border-inputb bg-card px-2.5 py-1.5 text-xs font-semibold text-textc"
      :aria-label="t('settings.title')"
      @click="openSettings"
    >
      <Settings class="h-3.5 w-3.5" :stroke-width="2" aria-hidden="true" />
      <span class="hidden sm:inline">{{ t('settings.title') }}</span>
    </button>

    <div
      v-if="open && showAccount"
      class="absolute end-0 top-[calc(100%+0.5rem)] z-50 min-w-[15rem] rounded-2xl border border-inputb bg-card py-1 shadow-lg"
      role="menu"
    >
      <div class="border-b border-inputb px-3 py-3" role="group" @click.stop>
        <p class="mb-2 text-[0.625rem] font-semibold uppercase tracking-wide text-muted">
          {{ t('homeScope.label') }}
        </p>
        <div class="flex gap-1 rounded-lg bg-input p-0.5">
          <button
            type="button"
            class="flex-1 rounded-md px-2 py-1.5 text-[0.6875rem] font-semibold leading-tight"
            :class="
              store.homeDateScope === 'currentMonth'
                ? 'bg-card text-accent shadow-sm'
                : 'text-muted'
            "
            @click="setHomeScope('currentMonth')"
          >
            {{ t('homeScope.currentMonth') }}
          </button>
          <button
            type="button"
            class="flex-1 rounded-md px-2 py-1.5 text-[0.6875rem] font-semibold leading-tight"
            :class="
              store.homeDateScope === 'all' ? 'bg-card text-accent shadow-sm' : 'text-muted'
            "
            @click="setHomeScope('all')"
          >
            {{ t('homeScope.all') }}
          </button>
        </div>
      </div>
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm text-textc hover:bg-input"
        @click="openSettings"
      >
        <Settings class="h-4 w-4 text-muted" :stroke-width="2" aria-hidden="true" />
        {{ t('settings.title') }}
      </button>
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2 border-t border-inputb px-3 py-2.5 text-start text-sm text-red-700 hover:bg-input"
        @click="signOut"
      >
        <LogOut class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
        {{ t('auth.signOut') }}
      </button>
    </div>
  </div>
</template>