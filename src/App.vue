<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCalculatorStore } from './stores/calculator'
import { buildExportCsv } from './utils/csv'
import SummaryCard from './components/SummaryCard.vue'
import RowList from './components/RowList.vue'
import StatsOverview from './components/StatsOverview.vue'
import ImportCsv from './components/ImportCsv.vue'
import LangSwitcher from './components/LangSwitcher.vue'
import BottomNav from './components/BottomNav.vue'

const { t } = useI18n()
const store = useCalculatorStore()
const tab = ref('tracker')

function clearAll() {
  if (confirm(`${t('actions.clearAll')}?`)) store.clearAll()
}

function exportCSV() {
  const csv = buildExportCsv(store.rows, store.hourlyRate, [
    t('csv.date'),
    t('csv.start'),
    t('csv.end'),
    t('csv.duration'),
    t('csv.pay'),
  ])
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `hours-${date}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div
    class="flex min-h-dvh flex-col bg-gradient-to-b from-sky-50 via-[#e8f4f8] to-slate-50"
  >
    <header
      class="pwa-titlebar sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-inputb bg-sky-50/95 py-3 backdrop-blur-sm ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]"
      role="banner"
    >
      <h1
        class="m-0 min-w-0 flex-1 truncate text-lg font-semibold text-accent"
      >
        {{ t('app.title') }}
      </h1>
      <LangSwitcher />
    </header>

    <main
      class="pwa-main-offset mx-auto w-full max-w-xl flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3 ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))] sm:max-w-2xl sm:pt-4"
    >
      <p v-if="tab === 'tracker'" class="mb-4 text-[0.8125rem] leading-snug text-muted">
        {{ t('app.subtitle') }}
      </p>

      <div class="flex flex-col gap-1">
        <template v-if="tab === 'tracker'">
          <SummaryCard @exportCSV="exportCSV" @clearAll="clearAll" />
          <RowList />
        </template>
        <StatsOverview v-else-if="tab === 'stats'" />
        <ImportCsv v-else-if="tab === 'import'" @imported="tab = 'tracker'" />
      </div>
    </main>

    <BottomNav v-model="tab" />
  </div>
</template>