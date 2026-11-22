<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Pencil, Trash2, TriangleAlert } from '@lucide/vue'
import { useTimeCalc } from '../composables/useTimeCalc'
import type { DraftEntry } from '../types/calculator'

const props = withDefaults(
  defineProps<{
    row: DraftEntry
    editable?: boolean
  }>(),
  { editable: false },
)

defineEmits<{
  edit: []
  delete: []
}>()

const { t, locale } = useI18n()
const { durationMinutes, hoursDecimal, formatHM, currency, rowWarning } = useTimeCalc()
const warning = computed(() => rowWarning(props.row))

const dateLabel = computed(() => {
  const d = props.row.date
  if (!d) return '—'
  return new Date(`${d}T00:00:00`).toLocaleDateString(locale.value || undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
})

const lbl = props.editable ? 'mb-1.5 block text-[0.6875rem] font-semibold text-muted' : 'block text-[0.6875rem] font-semibold text-muted'
const inp =
  'w-full h-10 rounded-[0.65rem] border border-inputb bg-white px-2.5 py-2 text-[0.9375rem] outline-none focus:ring-2 focus:ring-accent/30'
const val = 'text-[0.9375rem] font-semibold text-textc'
</script>

<template>
  <article class="rounded-2xl border border-inputb bg-slate-50 p-3.5">
  <template v-if="editable">
    <header class="mb-3 flex items-start gap-2">
      <div class="min-w-0 flex-1">
        <label :class="lbl">{{ t('row.date') }}</label>
        <input v-model="row.date" type="date" :class="[inp, 'text-sm']" />
      </div>
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
        <span :class="val">
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
  </template>

  <template v-else>
    <header class="mb-3 flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <span :class="lbl">{{ t('row.date') }}</span>
        <p :class="val">{{ dateLabel }}</p>
      </div>
      <div class="flex shrink-0 gap-1.5">
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-[0.65rem] border border-inputb bg-white text-accent"
          :aria-label="t('actions.edit')"
          @click="$emit('edit')"
        >
          <Pencil class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-[0.65rem] border-0 bg-red-500/10 text-red-600"
          :aria-label="t('actions.delete')"
          @click="$emit('delete')"
        >
          <Trash2 class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
        </button>
      </div>
    </header>

    <div class="mb-3 flex flex-row gap-2">
      <div class="min-w-0 max-w-16 flex-1">
        <span :class="lbl">{{ t('row.from') }}</span>
        <p :class="[val, 'text-sm']">{{ row.start || '—' }}</p>
      </div>
      <div class="min-w-0 max-w-16 flex-1">
        <span :class="lbl">{{ t('row.to') }}</span>
        <p :class="[val, 'text-sm']">{{ row.end || '—' }}</p>
      </div>
      <div class="min-w-0 flex-1">
        <span :class="lbl">{{ t('row.duration') }}</span>
        <p :class="[val, 'text-sm']">
          {{ formatHM(durationMinutes(row)) }}
          <span class="text-[0.625rem] font-medium text-muted ml-1">
            ({{ hoursDecimal(row).toFixed(2) }} {{ t('row.hours') }})
          </span>
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-2.5 border-t border-dashed border-inputb pt-2.5">
      <div class="flex items-end justify-between gap-3">
        <div>
          <span :class="lbl">{{ t('row.price') }}</span>
          <p :class="val">{{ currency(row.price) }}</p>
        </div>
        <div>
          <span :class="lbl">{{ t('row.pay') }}</span>
          <span class="text-base font-bold text-accent">{{ currency(hoursDecimal(row) * row.price) }}</span>
        </div>
      </div>
    </div>
  </template>

    <p v-if="warning" class="mt-2 flex items-center gap-1 text-xs text-amber-600">
      <TriangleAlert class="h-3.5 w-3.5 shrink-0" :stroke-width="2" aria-hidden="true" />
      {{ warning }}
    </p>
  </article>
</template>