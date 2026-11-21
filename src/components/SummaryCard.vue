<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff } from '@lucide/vue'
import { useCalculatorStore } from '../stores/calculator'
import { durationMinutes, hoursDecimal, useTimeCalc } from '../composables/useTimeCalc'

const PAY_VISIBLE_KEY = 'hours-calc-pay-visible'

const { t } = useI18n()
const { formatHM, currency } = useTimeCalc()
const store = useCalculatorStore()

const showPay = ref(false)

onMounted(() => {
  try {
    const stored = localStorage.getItem(PAY_VISIBLE_KEY)
    if (stored === '1') showPay.value = true
  } catch {
    /* ignore */
  }
})

watch(showPay, (visible) => {
  try {
    localStorage.setItem(PAY_VISIBLE_KEY, visible ? '1' : '0')
  } catch {
    /* ignore */
  }
})

const totalMinutes = computed(() =>
  store.homeDisplayRows.reduce((sum, row) => sum + durationMinutes(row), 0),
)
const totalPay = computed(() =>
  store.homeDisplayRows.reduce(
    (sum, row) => sum + hoursDecimal(row) * (row.price ?? store.hourlyRate),
    0,
  ),
)

const scopeHint = computed(() =>
  store.homeDateScope === 'currentMonth' ? t('homeScope.summaryCurrentMonth') : null,
)

function togglePayVisible() {
  showPay.value = !showPay.value
}
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
        <div class="flex items-center justify-between gap-1">
          <span class="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
            {{ t('summary.totalPay') }}
          </span>
          <button
            type="button"
            class="flex shrink-0 items-center justify-center rounded-lg border-0 bg-transparent p-1 text-muted transition-colors hover:text-accent"
            :aria-label="showPay ? t('summary.hidePayAmount') : t('summary.showPayAmount')"
            :aria-pressed="showPay"
            @click="togglePayVisible"
          >
            <Eye v-if="showPay" class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
            <EyeOff v-else class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
          </button>
        </div>
        <span
          class="text-[1.35rem] font-bold leading-tight"
          :class="showPay ? 'text-accent' : 'tracking-widest text-muted'"
        >
          {{ showPay ? currency(totalPay) : '••••' }}
        </span>
      </div>
    </div>
    <p v-if="scopeHint" class="mt-3 text-center text-[0.6875rem] text-muted">{{ scopeHint }}</p>
  </div>
</template>