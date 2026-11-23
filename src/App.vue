<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from './stores/auth'
import { isFirebaseConfigured } from './lib/firebase'
import SummaryCard from './components/SummaryCard.vue'
import RowList from './components/RowList.vue'
import StatsOverview from './components/StatsOverview.vue'
import ImportCsv from './components/ImportCsv.vue'
import UserSettings from './components/UserSettings.vue'
import LangSwitcher from './components/LangSwitcher.vue'
import AuthMenu from './components/AuthMenu.vue'
import SignInPage from './components/SignInPage.vue'
import PrivacyPolicyPage from './components/PrivacyPolicyPage.vue'
import HomePage from './components/HomePage.vue'
import BottomNav from './components/BottomNav.vue'
import { useAppPath } from './composables/useAppPath'

const { t } = useI18n()
const auth = useAuthStore()
const tab = ref('tracker')
const tabBeforeSettings = ref('tracker')

const { isPrivacyPage, isHomePage, isPublicPage } = useAppPath()

const requiresAuth = isFirebaseConfigured()
const showApp = computed(() => !requiresAuth || Boolean(auth.user))
const booting = computed(() => requiresAuth && !auth.ready && !isPublicPage.value)

const headerTitle = computed(() =>
  tab.value === 'settings' ? t('settings.title') : t('app.title'),
)

function openSettings() {
  if (tab.value !== 'settings') {
    tabBeforeSettings.value = tab.value
  }
  tab.value = 'settings'
}

function closeSettings() {
  tab.value = tabBeforeSettings.value || 'tracker'
}

function onNavChange(next: string) {
  tab.value = next
}
</script>

<template>
  <PrivacyPolicyPage v-if="isPrivacyPage" />

  <HomePage v-else-if="isHomePage" />

  <div
    v-else-if="booting"
    class="flex min-h-dvh items-center justify-center bg-gradient-to-b from-sky-50 via-[#e8f4f8] to-slate-50 text-sm text-muted"
  >
    {{ t('auth.loading') }}
  </div>

  <SignInPage v-else-if="requiresAuth && !auth.user" />

  <div
    v-else-if="showApp"
    class="flex min-h-dvh flex-col bg-gradient-to-b from-sky-50 via-[#e8f4f8] to-slate-50"
  >
    <header
      class="pwa-titlebar sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-inputb bg-sky-50/95 py-3 backdrop-blur-sm ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]"
      role="banner"
    >
      <div
        class="m-0 min-w-0 flex items-center gap-2 flex-1"
      >
        <img src="/icons/favicon.png" :alt="headerTitle" class="size-10 rounded-full" width="40" height="40" />
        <div class="m-0 min-w-0 flex-1 truncate text-lg font-semibold text-accent">
          {{ headerTitle }}
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <AuthMenu @open-settings="openSettings" />
        <LangSwitcher />
      </div>
    </header>

    <main
      class="pwa-main-offset mx-auto w-full max-w-xl flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3 ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))] sm:max-w-2xl sm:pt-4"
    >
      <p
        v-if="tab === 'tracker'"
        class="mb-4 text-[0.8125rem] leading-snug text-muted"
      >
        {{ t('app.subtitle') }}
      </p>

      <div class="flex flex-col gap-1">
        <template v-if="tab === 'tracker'">
          <SummaryCard />
          <RowList />
        </template>
        <StatsOverview v-else-if="tab === 'stats'" />
        <ImportCsv v-else-if="tab === 'import'" @imported="tab = 'tracker'" />
        <UserSettings v-else-if="tab === 'settings'" @back="closeSettings" />
      </div>
    </main>

    <BottomNav
      v-if="tab !== 'settings'"
      :model-value="tab"
      @update:model-value="onNavChange"
    />
  </div>
</template>