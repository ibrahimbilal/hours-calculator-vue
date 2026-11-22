<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileUp, Upload } from '@lucide/vue'
import { useCalculatorStore } from '../stores/calculator'
import { hoursDecimal, useTimeCalc } from '../composables/useTimeCalc'
import { entriesFromCsv } from '../utils/csv'

const emit = defineEmits<{ imported: [] }>()

const { t } = useI18n()
const store = useCalculatorStore()
const { currency } = useTimeCalc()

type ImportMode = 'merge' | 'replace'

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const isDragging = ref(false)
const mode = ref<ImportMode>('merge')
const preview = ref<ReturnType<typeof entriesFromCsv> | null>(null)
const status = ref<'idle' | 'success' | 'error'>('idle')
const statusDetail = ref('')

const previewRows = computed(() => preview.value?.entries.slice(0, 8) ?? [])
const rowCount = computed(() => preview.value?.entries.length ?? 0)
const parseErrors = computed(() => preview.value?.errors ?? [])
const previewHasPay = computed(() =>
  preview.value?.entries.some((row) => typeof row.price === 'number') ?? false,
)

let dragDepth = 0

function parseText(text: string) {
  preview.value = entriesFromCsv(text, (line) => t('import.errors.invalidRow', { n: line }))
  status.value = 'idle'
  statusDetail.value = ''
}

async function loadFile(file: File) {
  if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
    status.value = 'error'
    statusDetail.value = t('import.errors.notCsv')
    return
  }
  fileName.value = file.name
  const text = await file.text()
  parseText(text)
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await loadFile(file)
}

function onDragEnter(event: DragEvent) {
  event.preventDefault()
  dragDepth += 1
  isDragging.value = true
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

function onDragLeave(event: DragEvent) {
  event.preventDefault()
  dragDepth -= 1
  if (dragDepth <= 0) {
    dragDepth = 0
    isDragging.value = false
  }
}

async function onDrop(event: DragEvent) {
  event.preventDefault()
  dragDepth = 0
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  await loadFile(file)
}

function openFilePicker() {
  fileInput.value?.click()
}

function applyImport() {
  if (!preview.value?.entries.length) {
    status.value = 'error'
    statusDetail.value = t('import.errors.noValidRows')
    return
  }
  store.importEntries(preview.value.entries, mode.value)
  status.value = 'success'
  statusDetail.value = t('import.success', { n: preview.value.entries.length })
  emit('imported')
}

</script>

<template>
  <div class="space-y-5 rounded-2xl bg-card p-4 shadow-xl sm:p-6">
    <div>
      <h2 class="mb-1 text-lg font-semibold text-textc">{{ t('import.title') }}</h2>
      <p class="text-sm text-muted">{{ t('import.description') }}</p>
      <p class="mt-2 text-xs text-muted">{{ t('import.formatHint') }}</p>
    </div>

    <div
        role="button"
        tabindex="0"
        class="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        :class="
          isDragging
            ? 'border-accent bg-accent/10 scale-[1.01]'
            : 'border-inputb bg-input/40 hover:border-accent/60 hover:bg-accent/5'
        "
        @click="openFilePicker"
        @keydown.enter.prevent="openFilePicker"
        @keydown.space.prevent="openFilePicker"
        @dragenter="onDragEnter"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <div
          class="flex size-14 items-center justify-center rounded-full"
          :class="isDragging ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'"
        >
          <Upload v-if="isDragging" class="size-7" :stroke-width="2" aria-hidden="true" />
          <FileUp v-else class="size-7" :stroke-width="2" aria-hidden="true" />
        </div>
        <div>
          <p class="text-sm font-semibold text-textc">
            {{ isDragging ? t('import.dropHere') : t('import.dropOrClick') }}
          </p>
          <p class="mt-1 truncate text-xs text-muted">
            {{ fileName || t('import.noFile') }}
          </p>
        </div>
        <span class="text-xs text-muted">{{ t('import.chooseFile') }} · .csv</span>
        <input
          ref="fileInput"
          type="file"
          accept=".csv,text/csv"
          class="sr-only"
          @change="onFileChange"
        />
    </div>

    <fieldset class="space-y-2">
      <legend class="mb-2 text-sm font-medium">{{ t('import.modeLabel') }}</legend>
      <label class="flex cursor-pointer items-center gap-2 text-sm">
        <input v-model="mode" type="radio" value="merge" class="accent-accent" />
        {{ t('import.modeMerge') }}
      </label>
      <label class="flex cursor-pointer items-center gap-2 text-sm">
        <input v-model="mode" type="radio" value="replace" class="accent-accent" />
        {{ t('import.modeReplace') }}
      </label>
    </fieldset>

    <div v-if="preview && rowCount > 0" class="space-y-3">
      <p class="text-sm">{{ t('import.rowsFound', { n: rowCount }) }}</p>
      <div class="overflow-x-auto rounded-lg border border-inputb">
        <table class="w-full text-sm">
          <thead class="bg-input text-muted">
            <tr>
              <th class="px-3 py-2 text-start">{{ t('csv.date') }}</th>
              <th class="px-3 py-2 text-start">{{ t('csv.start') }}</th>
              <th class="px-3 py-2 text-start">{{ t('csv.end') }}</th>
              <th v-if="previewHasPay" class="px-3 py-2 text-start">{{ t('csv.duration') }}</th>
              <th v-if="previewHasPay" class="px-3 py-2 text-start">{{ t('csv.pay') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in previewRows" :key="idx" class="border-t border-inputb">
              <td class="px-3 py-2">{{ row.date }}</td>
              <td class="px-3 py-2">{{ row.start }}</td>
              <td class="px-3 py-2">{{ row.end }}</td>
              <template v-if="previewHasPay">
                <td class="px-3 py-2">
                  <template v-if="typeof row.price === 'number'">
                    {{ hoursDecimal(row).toFixed(2) }}
                  </template>
                  <template v-else>—</template>
                </td>
                <td class="px-3 py-2">
                  <template v-if="typeof row.price === 'number'">
                    {{ currency(hoursDecimal(row) * row.price) }}
                  </template>
                  <template v-else>—</template>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="rowCount > previewRows.length" class="text-xs text-muted">
        {{ t('import.previewTruncated', { n: previewRows.length, total: rowCount }) }}
      </p>
    </div>

    <ul v-if="parseErrors.length" class="space-y-1 text-sm text-amber-600">
      <li v-for="(err, i) in parseErrors" :key="i">
        <template v-if="err === 'empty'">{{ t('import.errors.empty') }}</template>
        <template v-else>{{ err }}</template>
      </li>
    </ul>

    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
        :disabled="!rowCount"
        @click="applyImport"
      >
        {{ t('import.importButton') }}
      </button>
      <p
        v-if="status !== 'idle'"
        class="text-sm"
        :class="status === 'success' ? 'text-green-600' : 'text-red-600'"
      >
        {{ statusDetail }}
      </p>
    </div>
  </div>
</template>