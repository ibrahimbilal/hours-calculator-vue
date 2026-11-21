<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Plus } from '@lucide/vue'

defineProps<{
  canAdd: boolean
}>()

defineEmits(['add'])

const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="fixed z-[44] flex h-14 w-14 items-center justify-center rounded-full border-0 text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 end-[max(1.25rem,env(safe-area-inset-right))] bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
    :class="
      canAdd
        ? 'bg-gradient-to-br from-teal-400 to-accent shadow-fab'
        : 'bg-slate-400 shadow-fab-muted'
    "
    :disabled="!canAdd"
    :aria-label="t('actions.addEntry')"
    :title="canAdd ? t('empty.hintUnified') : t('warnings.fillTimesFirst')"
    @click="$emit('add')"
  >
    <Plus class="h-6 w-6" :stroke-width="2.5" aria-hidden="true" />
  </button>
</template>