<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCalculatorStore } from '../stores/calculator'
import { durationMinutes, useTimeCalc } from '../composables/useTimeCalc'
import {
  currentWeekKey,
  formatISOWeekKey,
  isoWeekKey,
  isoWeekRangeLabel,
  parseISOWeekKey,
  weekKeyFromDate,
} from '../utils/isoWeek'
import type { DraftEntry, TimeEntry } from '../types/calculator'
import { ChevronDown } from '@lucide/vue'
import TimeRow from './TimeRow.vue'
import FabAdd from './FabAdd.vue'
import EntryModal from './EntryModal.vue'

interface WeekGroup {
  weekKey: string
  weekLabel: string
  weekRange: string
  isCurrent: boolean
  entries: { row: TimeEntry; idx: number }[]
  totalMins: number
}

const { t, locale } = useI18n()
const { formatHM } = useTimeCalc()
const store = useCalculatorStore()

const collapsed = ref(new Set<string>())
const showEntryModal = ref(false)
const draftRow = ref<DraftEntry | null>(null)
const modalExistingIdx = ref<number | null>(null)

onMounted(() => {
  const thisWeek = currentWeekKey()
  collapsed.value = new Set(weekGroups.value.map((g) => g.weekKey).filter((k) => k !== thisWeek))
})

function toggleWeek(key: string): void {
  const next = new Set(collapsed.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  collapsed.value = next
}

function expandWeek(key: string) {
  if (collapsed.value.has(key)) {
    const next = new Set(collapsed.value)
    next.delete(key)
    collapsed.value = next
  }
}

function closeEntryModal() {
  showEntryModal.value = false
  draftRow.value = null
  modalExistingIdx.value = null
}

const modalRow = computed((): DraftEntry | null => {
  if (modalExistingIdx.value !== null) {
    return store.rows[modalExistingIdx.value] ?? null
  }
  return draftRow.value
})

function addEntry() {
  if (showEntryModal.value) return

  const incompleteIdx = store.rows.findIndex((row) => !row.start || !row.end)
  if (incompleteIdx >= 0) {
    modalExistingIdx.value = incompleteIdx
    draftRow.value = null
    showEntryModal.value = true
    const row = store.rows[incompleteIdx]!
    expandWeek(weekKeyFromDate(row.date || store.today()))
    return
  }

  modalExistingIdx.value = null
  draftRow.value = {
    date: store.today(),
    start: '',
    end: '',
    price: store.hourlyRate,
  }
  showEntryModal.value = true
}

function saveEntry() {
  const row = modalRow.value
  if (!row?.start || !row?.end) return

  if (modalExistingIdx.value === null) {
    store.addRowFull({
      date: row.date,
      start: row.start,
      end: row.end,
      price: row.price,
    })
  }

  expandWeek(weekKeyFromDate(row.date || store.today()))
  closeEntryModal()
}

const canAdd = computed(() => !showEntryModal.value)

function makeWeekGroup(weekKey: string, thisWeek: string | null): WeekGroup {
  const parsed = parseISOWeekKey(weekKey)
  const weekLabel = parsed
    ? t('week.labelWithYear', { n: parsed.week, y: parsed.year })
    : t('week.noDate')
  return {
    weekKey,
    weekLabel,
    weekRange: isoWeekRangeLabel(weekKey, locale.value),
    isCurrent: weekKey === thisWeek,
    entries: [],
    totalMins: 0,
  }
}

const weekGroups = computed((): WeekGroup[] => {
  const thisWeek = currentWeekKey()
  const list: WeekGroup[] = []
  const map = new Map<string, WeekGroup>()
  store.rows.forEach((row, idx) => {
    if (!row.start || !row.end) return
    if (!store.rowVisibleOnHome(row)) return
    const { week, year } = isoWeekKey(row.date)
    const weekKey =
      week !== null && year !== null ? formatISOWeekKey(year, week) : 'no-date'
    if (!map.has(weekKey)) {
      const group = makeWeekGroup(weekKey, thisWeek)
      map.set(weekKey, group)
      list.push(group)
    }
    const g = map.get(weekKey)!
    g.entries.push({ row, idx })
    g.totalMins += durationMinutes(row)
  })

  list.sort((a, b) => {
    if (a.weekKey === 'no-date') return 1
    if (b.weekKey === 'no-date') return -1
    const [yA, wA] = a.weekKey.split('-W').map(Number)
    const [yB, wB] = b.weekKey.split('-W').map(Number)
    if (yA !== yB) return yB - yA
    return wB - wA
  })
  return list
})

const hasCompleteRows = computed(() =>
  store.rows.some((row) => row.start && row.end),
)

const hasRowsOutsideHomeScope = computed(() =>
  store.rows.some((row) => row.start && row.end && !store.rowVisibleOnHome(row)),
)
</script>

<template>
  <template v-if="weekGroups.length">
    <div class="flex flex-col gap-3 pb-24">
      <section
        v-for="group in weekGroups"
        :key="group.weekKey"
        class="overflow-hidden rounded-[1.25rem] border border-inputb bg-card shadow-week"
        :class="group.isCurrent ? 'border-accent/35 shadow-week-current' : ''"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 border-0 bg-transparent px-4 py-3.5 text-start active:bg-input"
          @click="toggleWeek(group.weekKey)"
        >
          <div class="flex min-w-0 flex-col gap-0.5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[0.8125rem] font-bold uppercase tracking-wide text-accent">
                {{ group.weekLabel }}
              </span>
              <span
                v-if="group.isCurrent"
                class="rounded-full bg-accent/15 px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-accent"
              >
                {{ t('week.current') }}
              </span>
            </div>
            <span v-if="group.weekRange" class="text-xs text-muted">{{ group.weekRange }}</span>
          </div>
          <div class="flex shrink-0 items-center gap-1.5">
            <span class="text-sm font-bold text-textc">{{ formatHM(group.totalMins) }}</span>
            <ChevronDown
              class="h-5 w-5 text-muted transition-transform"
              :class="{ 'rotate-180': !collapsed.has(group.weekKey) }"
              :stroke-width="2"
              aria-hidden="true"
            />
          </div>
        </button>
        <div v-show="!collapsed.has(group.weekKey)" class="px-3 pb-4">
          <div class="flex flex-col gap-3">
            <TimeRow
              v-for="entry in group.entries"
              :key="entry.row.id"
              :row="entry.row"
              @remove="store.removeRow(entry.idx)"
            />
          </div>
        </div>
      </section>
    </div>
  </template>
  <div
    v-else
    class="mb-20 rounded-[1.25rem] border-2 border-dashed border-inputb bg-white/60 px-4 py-8 text-center"
  >
    <p class="m-0 font-semibold text-textc">
      {{
        store.homeDateScope === 'currentMonth' && hasRowsOutsideHomeScope
          ? t('homeScope.emptyCurrentMonth')
          : t('empty.message')
      }}
    </p>
    <p class="mt-2 text-[0.8125rem] text-muted">
      {{
        store.homeDateScope === 'currentMonth' && hasCompleteRows
          ? t('homeScope.switchToAllHint')
          : t('empty.hintUnified')
      }}
    </p>
  </div>

  <FabAdd :can-add="canAdd" @add="addEntry" />

  <EntryModal
    :open="showEntryModal"
    :row="modalRow"
    @cancel="closeEntryModal"
    @save="saveEntry"
  />
</template>