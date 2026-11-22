<script setup lang="ts">
import { onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}>()

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()

const { t } = useI18n()

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
      enter-active-class="transition-opacity duration-200 ease-out"
      leave-active-class="transition-opacity duration-150 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[70] flex items-center justify-center p-4"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="'confirm-dialog-title'"
        :aria-describedby="'confirm-dialog-desc'"
      >
        <button
          type="button"
          class="absolute inset-0 border-0 bg-slate-900/50 backdrop-blur-sm"
          :aria-label="cancelLabel ?? t('actions.cancel')"
          @click="emit('cancel')"
        />

        <div
          class="relative z-10 w-full max-w-sm rounded-2xl border border-inputb bg-card p-5 shadow-2xl"
        >
          <h2 id="confirm-dialog-title" class="text-lg font-semibold text-textc">
            {{ title }}
          </h2>
          <p id="confirm-dialog-desc" class="mt-2 text-sm text-muted">
            {{ message }}
          </p>

          <div class="mt-5 flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-xl border border-inputb bg-input px-4 py-3 text-sm font-semibold text-textc transition active:scale-[0.98]"
              @click="emit('cancel')"
            >
              {{ cancelLabel ?? t('actions.cancel') }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-xl border-0 px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
              :class="
                danger !== false
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gradient-to-br from-teal-400 to-accent'
              "
              @click="emit('confirm')"
            >
              {{ confirmLabel ?? t('actions.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>