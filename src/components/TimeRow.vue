<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Trash2, TriangleAlert } from '@lucide/vue'
import { useTimeCalc } from '../composables/useTimeCalc'
import type { DraftEntry } from '../types/calculator'

const props = withDefaults(
  defineProps<{
    row: DraftEntry
    showDelete?: boolean
  }>(),
  { showDelete: true },
)

defineEmits(['remove'])

const { t } = useI18n()
const { durationMinutes, hoursDecimal, formatHM, currency, rowWarning } = useTimeCalc()
const warning = computed(() => rowWarning(props.row))

const lbl = 'mb-1.5 block text-[0.6875rem] font-semibold text-muted'
const inp =
  'w-full h-10 rounded-[0.65rem] border border-inputb bg-white px-2.5 py-2 text-[0.9375rem] outline-none focus:ring-2 focus:ring-accent/30'
</script>

<template>
  <article class="rounded-2xl border border-inputb bg-slate-50 p-3.5">
    <header
      class="mb-3 flex gap-2"
      :class="showDelete ? 'items-end justify-between' : 'items-start'"
    >
      <div class="min-w-0 flex-1">
        <label :class="lbl">{{ t('row.date') }}</label>
        <input v-model="row.date" type="date" :class="[inp, 'text-sm']" />
      </div>
      <button
        v-if="showDelete"
        type="button"
        class="flex size-10 shrink-0 items-center justify-center rounded-[0.65rem] border-0 bg-red-500/10 text-red-600"
        :aria-label="t('actions.delete')"
        @click="$emit('remove')"
      >
        <Trash2 class="h-[1.1rem] w-[1.1rem]" :stroke-width="2" aria-hidden="true" />
      </button>
    </header>

    <div class="mb-3 grid grid-cols-2 gap-2.5">
      <div>
        <label :class="lbl">{{ t('row.from') }}</label>
        <input v-model="row.start" type="time" step="60" :class="inp" />
      </div>
      <div>
        <label :class="lbl">{{ t('row.to') }}</label>
        <input v-model="row.end" type="time" step="60" :class="inp" />
      </div>
    </div>

    <div class="flex flex-col gap-2.5 border-t border-dashed border-inputb pt-2.5">
      <div>
        <span :class="lbl">{{ t('row.duration') }}</span>
        <span class="text-[0.9375rem] font-semibold text-textc">
          {{ formatHM(durationMinutes(row)) }}
          <span class="text-xs font-medium text-muted">
            ({{ hoursDecimal(row).toFixed(2) }} {{ t('row.hours') }})
          </span>
        </span>
      </div>
      <div class="flex items-end justify-between gap-3">
        <div>
          <label :class="lbl">{{ t('row.price') }}</label>
          <input v-model.number="row.price" type="number" name="price" :class="[inp, 'w-[5.5rem]']" />
        </div>
        <div>
          <span :class="lbl">{{ t('row.pay') }}</span>
          <span class="text-base font-bold text-accent">{{ currency(hoursDecimal(row) * row.price) }}</span>
        </div>
      </div>
    </div>

    <p v-if="warning" class="mt-2 flex items-center gap-1 text-xs text-amber-600">
      <TriangleAlert class="h-3.5 w-3.5 shrink-0" :stroke-width="2" aria-hidden="true" />
      {{ warning }}
    </p>
  </article>
</template>