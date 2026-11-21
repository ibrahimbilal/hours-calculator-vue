<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, Eraser, FileDown } from '@lucide/vue'
import { useCalculatorStore } from '../stores/calculator'
import { durationMinutes, hoursDecimal, useTimeCalc } from '../composables/useTimeCalc'

defineEmits(['exportCSV', 'clearAll'])

const { t } = useI18n()
const { formatHM, currency } = useTimeCalc()
const store = useCalculatorStore()

const showDetails = ref(false)

const totalMinutes = computed(() => store.rows.reduce((sum, row) => sum + durationMinutes(row), 0))
const totalPay = computed(() =>
  store.rows.reduce((sum, row) => sum + hoursDecimal(row) * (row.price ?? store.hourlyRate), 0),
)
</script>

<template>
  <div
    class="mb-4 rounded-[1.25rem] border border-accent/10 bg-card px-4 py-5 shadow-summary-card"
  >
    <div class="flex items-stretch gap-4">
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span class="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          {{ t('summary.total') }}
        </span>
        <span class="text-[1.75rem] font-bold leading-tight text-accent">
          {{ formatHM(totalMinutes) }}
        </span>
        <span class="text-xs text-muted">
          {{ (totalMinutes / 60).toFixed(2) }} {{ t('row.hours') }}
        </span>
      </div>
      <div class="w-px shrink-0 bg-inputb" aria-hidden="true" />
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span class="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          {{ t('summary.totalPay') }}
        </span>
        <span class="text-[1.35rem] font-bold leading-tight text-accent">{{ currency(totalPay) }}</span>
      </div>
    </div>

    <button
      type="button"
      class="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border-0 bg-input px-2 py-2 text-[0.8125rem] font-semibold text-textc"
      :aria-expanded="showDetails"
      @click="showDetails = !showDetails"
    >
      <span>{{ showDetails ? t('summary.hideDetails') : t('summary.showDetails') }}</span>
      <ChevronDown
        class="h-4 w-4 transition-transform"
        :class="{ 'rotate-180': showDetails }"
        :stroke-width="2"
        aria-hidden="true"
      />
    </button>

    <div v-show="showDetails" class="mt-4 border-t border-inputb pt-4">
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

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          class="flex min-w-[7rem] flex-1 items-center justify-center gap-1.5 rounded-xl border border-yellow-400 bg-yellow-400 px-4 py-2.5 text-[0.8125rem] font-semibold text-yellow-950"
          @click="$emit('exportCSV')"
        >
          <FileDown class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
          {{ t('actions.exportCSV') }}
        </button>
        <button
          type="button"
          class="flex min-w-[7rem] flex-1 items-center justify-center gap-1.5 rounded-xl border border-inputb bg-transparent px-4 py-2.5 text-[0.8125rem] font-semibold text-textc"
          @click="$emit('clearAll')"
        >
          <Eraser class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
          {{ t('actions.clearAll') }}
        </button>
      </div>
      <p class="mt-2 text-[0.6875rem] text-muted">{{ t('summary.autoSave') }}</p>
    </div>
  </div>
</template>