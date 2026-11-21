<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, ChevronDown } from '@lucide/vue'
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import type { ChartConfiguration } from 'chart.js'
import { useCalculatorStore } from '../stores/calculator'
import { durationMinutes, useTimeCalc, formatCurrency } from '../composables/useTimeCalc'
import {
  isoWeekRangeLabel,
  parseISOWeekKey,
  shortYear,
  weekKeyFromDate,
} from '../utils/isoWeek'

type GroupBy = 'day' | 'week' | 'month'
type DatePreset = 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'all'

const groupModes: GroupBy[] = ['day', 'week', 'month']

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
)

const { t, locale } = useI18n()
const { formatHM } = useTimeCalc()
const store = useCalculatorStore()

const groupBy = ref<GroupBy>('week')
const dateFrom = ref('')
const dateTo = ref('')
const preset = ref<DatePreset | ''>('thisMonth')
const presets: DatePreset[] = ['thisWeek', 'thisMonth', 'lastMonth', 'thisYear', 'all']
const presetMenuOpen = ref(false)
const presetMenuEl = ref<HTMLElement | null>(null)
const chartRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const presetLabel = computed(() =>
  preset.value ? t(`stats.${preset.value}`) : t('stats.customRange'),
)

function onPresetDocClick(event: MouseEvent) {
  const target = event.target
  if (presetMenuEl.value && target instanceof Node && !presetMenuEl.value.contains(target)) {
    presetMenuOpen.value = false
  }
}

function selectPreset(key: DatePreset) {
  applyPreset(key)
  presetMenuOpen.value = false
}

function applyPreset(key: DatePreset): void {
  preset.value = key
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const iso = (d: Date) => d.toISOString().slice(0, 10)

  if (key === 'thisWeek') {
    const mondayOffset = (now.getDay() + 6) % 7
    const start = new Date(now)
    start.setDate(now.getDate() - mondayOffset)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    dateFrom.value = iso(start)
    dateTo.value = iso(end)
  } else if (key === 'thisMonth') {
    dateFrom.value = `${y}-${String(m + 1).padStart(2, '0')}-01`
    dateTo.value = iso(new Date(y, m + 1, 0))
  } else if (key === 'lastMonth') {
    const lm = m === 0 ? 11 : m - 1
    const ly = m === 0 ? y - 1 : y
    dateFrom.value = `${ly}-${String(lm + 1).padStart(2, '0')}-01`
    dateTo.value = iso(new Date(ly, lm + 1, 0))
  } else if (key === 'thisYear') {
    dateFrom.value = `${y}-01-01`
    dateTo.value = `${y}-12-31`
  } else {
    dateFrom.value = ''
    dateTo.value = ''
  }
}

applyPreset('thisMonth')

function bucketKey(date: string): string {
  if (groupBy.value === 'day') return date
  if (groupBy.value === 'week') return weekKeyFromDate(date)
  return date.slice(0, 7)
}

const chartDateLocale = computed(() => locale.value || undefined)

function bucketLabel(key: string): string {
  if (groupBy.value === 'day') {
    return new Date(`${key}T00:00:00`).toLocaleDateString(chartDateLocale.value, {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    })
  }
  if (groupBy.value === 'week') {
    const parsed = parseISOWeekKey(key)
    if (!parsed) return key
    const range = isoWeekRangeLabel(key, locale.value)
    return `${t('week.labelWithYear', { n: parsed.week, y: parsed.year })} · ${range}`
  }
  const [y, mo] = key.split('-')
  return new Date(parseInt(y, 10), parseInt(mo, 10) - 1, 1).toLocaleDateString(chartDateLocale.value, {
    month: 'short',
    year: '2-digit',
  })
}

/** Compact week label for the chart axis only, e.g. "week 45, 26". */
function chartBucketLabel(key: string): string {
  if (groupBy.value === 'week') {
    const parsed = parseISOWeekKey(key)
    if (!parsed) return key
    return t('stats.weekCanvasLabel', { n: parsed.week, y: shortYear(parsed.year) })
  }
  return bucketLabel(key)
}

const filteredRows = computed(() =>
  store.rows.filter(
    (row) =>
      row.date &&
      row.start &&
      row.end &&
      durationMinutes(row) > 0 &&
      (!dateFrom.value || row.date >= dateFrom.value) &&
      (!dateTo.value || row.date <= dateTo.value),
  ),
)

const periods = computed(() => {
  const map = new Map()
  for (const row of filteredRows.value) {
    const key = bucketKey(row.date)
    if (!map.has(key)) map.set(key, { key, totalMins: 0, totalPay: 0, days: new Set() })
    const bucket = map.get(key)
    bucket.totalMins += durationMinutes(row)
    bucket.totalPay += (durationMinutes(row) / 60) * (row.price ?? store.hourlyRate)
    bucket.days.add(row.date)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => ({
      key,
      label: bucketLabel(key),
      chartLabel: chartBucketLabel(key),
      totalMins: data.totalMins,
      totalPay: data.totalPay,
      days: data.days.size,
      hours: parseFloat((data.totalMins / 60).toFixed(2)),
      hoursFormatted: formatHM(data.totalMins),
      payFormatted: data.totalPay > 0 ? formatCurrency(data.totalPay) : '—',
      avgFormatted: data.days.size > 0 ? formatHM(Math.round(data.totalMins / data.days.size)) : '—',
    }))
})

const totalMinutes = computed(() => filteredRows.value.reduce((s, r) => s + durationMinutes(r), 0))
const totalPay = computed(() =>
  filteredRows.value.reduce(
    (s, r) => s + (durationMinutes(r) / 60) * (r.price ?? store.hourlyRate),
    0,
  ),
)
const uniqueDays = computed(() => new Set(filteredRows.value.map((r) => r.date)).size)
const avgPerDay = computed(() =>
  uniqueDays.value > 0 ? formatHM(Math.round(totalMinutes.value / uniqueDays.value)) : '—',
)

function buildChart() {
  if (!chartRef.value || periods.value.length === 0) return
  if (chart) {
    chart.destroy()
    chart = null
  }
  const data = periods.value
  const showPay = totalPay.value > 0
  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: data.map((p) => p.chartLabel),
      datasets: [
        {
          type: 'bar',
          label: t('stats.hours'),
          data: data.map((p) => p.hours),
          backgroundColor: 'rgba(13,148,136,0.45)',
          borderColor: '#0d9488',
          borderWidth: 1.5,
          borderRadius: 5,
          borderSkipped: false,
          yAxisID: 'yHours',
          order: 2,
        },
        ...(showPay
          ? [
              {
                type: 'line' as const,
                label: t('stats.pay'),
                data: data.map((p) => parseFloat(p.totalPay.toFixed(2))),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245,158,11,0.12)',
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#f59e0b',
                tension: 0.35,
                fill: false,
                yAxisID: 'yPay',
                order: 1,
              },
            ]
          : []),
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: { color: '#64748b', font: { size: 12 }, boxWidth: 12, padding: 16 },
        },
        tooltip: {
          callbacks: {
            title: (items) => data[items[0].dataIndex]?.label ?? '',
            label: (ctx) => {
              const p = data[ctx.dataIndex]
              if (ctx.dataset.yAxisID === 'yHours') {
                return `  ${t('stats.hours')}: ${p.hoursFormatted} (${p.hours}h)`
              }
              return `  ${t('stats.pay')}: ${p.payFormatted}`
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 }, maxRotation: 40 } },
        yHours: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          grid: { color: '#e7e7e7' },
          ticks: { color: '#0d9488', font: { size: 11 }, callback: (v) => `${v}h` },
        },
        ...(showPay && {
          yPay: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            ticks: { color: '#f59e0b', font: { size: 11 } },
          },
        }),
      },
    },
  }
  chart = new Chart(chartRef.value, config)
}

onMounted(() => {
  document.addEventListener('click', onPresetDocClick)
  nextTick(buildChart)
})
onUnmounted(() => document.removeEventListener('click', onPresetDocClick))
onBeforeUnmount(() => chart?.destroy())
watch(periods, () => nextTick(buildChart), { deep: true })
</script>

<template>
  <div>
    <div class="bg-card rounded-xl border border-inputb p-4 mb-5 space-y-3">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="flex flex-col gap-2">
          <span class="text-sm font-medium text-textc whitespace-nowrap">{{ t('stats.groupBy') }}</span>
          <div class="flex rounded-lg overflow-hidden border border-inputb text-sm font-medium">
            <button
              v-for="mode in groupModes"
              :key="mode"
              type="button"
              class="px-3 py-1.5 transition-colors"
              :class="groupBy === mode ? 'bg-accent text-white' : 'bg-white text-textc hover:bg-gray-50'"
              @click="groupBy = mode"
            >
              {{ t(`stats.${mode}`) }}
            </button>
          </div>
        </div>
        <div ref="presetMenuEl" class="relative ms-auto min-w-[7.5rem]">
          <button
            type="button"
            class="flex w-full h-8 items-center justify-between gap-2 rounded-lg border border-inputb bg-card px-3 py-1.5 text-xs font-medium text-textc transition hover:border-accent"
            :aria-expanded="presetMenuOpen"
            aria-haspopup="listbox"
            @click="presetMenuOpen = !presetMenuOpen"
          >
            <span class="truncate">{{ presetLabel }}</span>
            <ChevronDown
              class="h-4 w-4 shrink-0 transition-transform"
              :class="{ 'rotate-180': presetMenuOpen }"
              :stroke-width="2"
              aria-hidden="true"
            />
          </button>
          <ul
            v-if="presetMenuOpen"
            role="listbox"
            class="absolute end-0 z-20 mt-1 max-h-60 w-full min-w-[9rem] overflow-auto rounded-lg border border-inputb bg-card py-1 shadow-lg"
          >
            <li
              v-for="key in presets"
              :key="key"
              role="option"
              :aria-selected="preset === key"
            >
              <button
                type="button"
                class="flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-xs transition"
                :class="
                  preset === key
                    ? 'bg-accent/10 font-semibold text-accent'
                    : 'text-textc hover:bg-input'
                "
                @click="selectPreset(key)"
              >
                <span>{{ t(`stats.${key}`) }}</span>
                <Check
                  v-if="preset === key"
                  class="h-3.5 w-3.5 shrink-0"
                  :stroke-width="2.5"
                  aria-hidden="true"
                />
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span class="text-muted">{{ t('stats.dateRange') }}</span>
        <div class="flex items-center gap-2">
          <input
            v-model="dateFrom"
            type="date"
            class="rounded-lg border border-inputb bg-input px-2.5 py-1.5 text-textc focus:outline-none focus:border-accent"
            @change="preset = ''"
          />
          <span class="text-muted">→</span>
          <input
            v-model="dateTo"
            type="date"
            class="rounded-lg border border-inputb bg-input px-2.5 py-1.5 text-textc focus:outline-none focus:border-accent"
            @change="preset = ''"
          />
        </div>
        <span v-if="filteredRows.length > 0" class="text-xs text-muted ms-1">
          {{ filteredRows.length }} {{ t('stats.entries') }}
        </span>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      <div class="bg-card rounded-xl border border-inputb p-4">
        <div class="text-xs text-muted mb-1">{{ t('stats.totalHours') }}</div>
        <div class="text-2xl font-semibold text-accent">{{ formatHM(totalMinutes) }}</div>
        <div class="text-xs text-muted mt-1">
          {{ (totalMinutes / 60).toFixed(2) }}h {{ t('stats.decimal') }}
        </div>
      </div>
      <div class="bg-card rounded-xl border border-inputb p-4">
        <div class="text-xs text-muted mb-1">{{ t('stats.totalPay') }}</div>
        <div class="text-2xl font-semibold text-accent">
          <template v-if="totalPay > 0">{{ formatCurrency(totalPay) }}</template>
          <template v-else>—</template>
        </div>
        <div class="text-xs text-muted mt-1">&nbsp;</div>
      </div>
      <div class="bg-card rounded-xl border border-inputb p-4">
        <div class="text-xs text-muted mb-1">{{ t('stats.workDays') }}</div>
        <div class="text-2xl font-semibold text-accent">{{ uniqueDays }}</div>
        <div class="text-xs text-muted mt-1">{{ t('stats.uniqueDays') }}</div>
      </div>
      <div class="bg-card rounded-xl border border-inputb p-4">
        <div class="text-xs text-muted mb-1">{{ t('stats.avgPerDay') }}</div>
        <div class="text-2xl font-semibold text-accent">{{ avgPerDay }}</div>
        <div class="text-xs text-muted mt-1">
          {{ uniqueDays > 0 ? `${(totalMinutes / 60 / uniqueDays).toFixed(2)}h` : '—' }}
        </div>
      </div>
    </div>

    <div class="bg-card rounded-xl border border-inputb p-4 mb-5">
      <h3 class="text-sm font-medium text-textc mb-3">{{ t('stats.hoursPerPeriod') }}</h3>
      <div v-if="periods.length === 0" class="flex items-center justify-center py-16 text-sm text-muted">
        {{ t('stats.noData') }}
      </div>
      <div v-else class="relative" style="height: 280px">
        <canvas ref="chartRef" />
      </div>
    </div>

    <div class="bg-card rounded-xl border border-inputb overflow-hidden mb-5">
      <div class="px-4 py-3 border-b border-inputb flex items-center justify-between">
        <h3 class="text-sm font-medium text-textc">{{ t('stats.breakdown') }}</h3>
        <span v-if="periods.length > 0" class="text-xs text-muted">
          {{ periods.length }} {{ t('stats.periods') }}
        </span>
      </div>
      <div v-if="periods.length === 0" class="flex items-center justify-center py-16 text-sm text-muted">
        {{ t('stats.noData') }}
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-inputb text-muted text-xs uppercase tracking-wide">
              <th class="text-start px-4 py-2.5 font-semibold text-nowrap">{{ t('stats.period') }}</th>
              <th class="text-end px-4 py-2.5 font-semibold text-nowrap">{{ t('stats.daysWorked') }}</th>
              <th class="text-end px-4 py-2.5 font-semibold text-nowrap">{{ t('stats.hours') }}</th>
              <th v-if="totalPay > 0" class="text-end px-4 py-2.5 font-semibold text-nowrap">{{ t('stats.pay') }}</th>
              <th class="text-end px-4 py-2.5 font-semibold text-nowrap">{{ t('stats.avgDay') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(p, i) in periods"
              :key="p.key"
              class="border-b border-inputb transition-colors hover:bg-gray-50"
              :class="i % 2 === 1 ? 'bg-gray-50/40' : ''"
            >
              <td class="px-4 py-2.5 font-medium text-textc text-nowrap">{{ p.label }}</td>
              <td class="px-4 py-2.5 text-end text-muted text-nowrap">{{ p.days }}</td>
              <td class="px-4 py-2.5 text-end text-nowrap">
                <span class="font-medium text-textc">{{ p.hoursFormatted }}</span>
                <span class="text-xs text-muted ms-1">({{ p.hours.toFixed(2) }}h)</span>
              </td>
              <td v-if="totalPay > 0" class="px-4 py-2.5 text-end text-textc text-nowrap">{{ p.payFormatted }}</td>
              <td class="px-4 py-2.5 text-end text-muted text-nowrap">{{ p.avgFormatted }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-accent/5 border-t-2 border-accent/20 font-semibold">
              <td class="px-4 py-3 text-textc text-nowrap">{{ t('stats.total') }}</td>
              <td class="px-4 py-3 text-end text-textc text-nowrap">{{ uniqueDays }}</td>
              <td class="px-4 py-3 text-end text-accent text-nowrap">
                {{ formatHM(totalMinutes) }}
                <span class="text-xs font-normal text-muted ms-1">({{ (totalMinutes / 60).toFixed(2) }}h)</span>
              </td>
              <td v-if="totalPay > 0" class="px-4 py-3 text-end text-accent text-nowrap">
                {{ formatCurrency(totalPay) }}
              </td>
              <td class="px-4 py-3 text-end text-muted text-nowrap">{{ avgPerDay }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>