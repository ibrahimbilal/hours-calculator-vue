<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DraftEntry } from '../types/calculator'
import TimeRow from './TimeRow.vue'

const props = defineProps<{
  open: boolean
  row: DraftEntry | null
}>()

const emit = defineEmits<{
  cancel: []
  save: []
}>()

const { t } = useI18n()

const canSave = computed(() => Boolean(props.row?.start && props.row?.end))

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('cancel')
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
      document.addEventListener('keydown', onKeydown)
    } else {
      document.body.classList.remove('overflow-hidden')
      document.removeEventListener('keydown', onKeydown)
    }
  },
)

onUnmounted(() => {
  document.body.classList.remove('overflow-hidden')
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      leave-active-class="transition-opacity duration-200 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open && row"
        class="fixed inset-0 z-[60] flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'entry-modal-title'"
      >
        <button
          type="button"
          class="absolute inset-0 border-0 bg-slate-900/50 backdrop-blur-sm"
          :aria-label="t('actions.cancel')"
          @click="emit('cancel')"
        />

        <Transition
          appear
          enter-active-class="transition duration-350 ease-[cubic-bezier(0.32,0.72,0,1)]"
          enter-from-class="translate-y-full opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition duration-250 ease-in"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-full opacity-0"
        >
          <div
            v-if="open && row"
            class="relative z-10 max-h-[min(90dvh,640px)] w-full overflow-y-auto rounded-t-[1.5rem] border border-inputb border-b-0 bg-card px-4 pt-5 shadow-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <div class="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-inputb" aria-hidden="true" />

            <h2 id="entry-modal-title" class="mb-4 text-center text-lg font-semibold text-textc">
              {{ t('entryModal.title') }}
            </h2>

            <TimeRow :row="row" :show-delete="false" />

            <p v-if="!canSave" class="mt-3 text-center text-xs text-muted">
              {{ t('entryModal.fillTimes') }}
            </p>

            <div class="mt-5 flex gap-2">
              <button
                type="button"
                class="flex-1 rounded-xl border border-inputb bg-input px-4 py-3 text-sm font-semibold text-textc transition active:scale-[0.98]"
                @click="emit('cancel')"
              >
                {{ t('actions.cancel') }}
              </button>
              <button
                type="button"
                class="flex-1 rounded-xl border-0 bg-gradient-to-br from-teal-400 to-accent px-4 py-3 text-sm font-semibold text-white shadow-fab transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                :disabled="!canSave"
                @click="emit('save')"
              >
                {{ t('actions.save') }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>