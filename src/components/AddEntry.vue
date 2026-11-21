<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Ban, Plus } from '@lucide/vue'

withDefaults(
  defineProps<{
    canAdd: boolean
    hintKey?: string
  }>(),
  { hintKey: 'empty.hint' },
)

defineEmits(['add'])

const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="relative mt-5 flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
    :class="
      canAdd
        ? 'cursor-pointer border-accent/50 bg-accent/5 hover:border-accent hover:bg-accent/10'
        : 'cursor-not-allowed border-input bg-muted/5 opacity-60'
    "
    :disabled="!canAdd"
    @click="canAdd && $emit('add')"
  >
    <div class="rounded-full p-3" :class="canAdd ? 'bg-accent/10' : 'bg-muted'">
      <Plus v-if="canAdd" class="h-6 w-6 text-accent" :stroke-width="2" aria-hidden="true" />
      <Ban v-else class="h-6 w-6 text-white" :stroke-width="2" aria-hidden="true" />
    </div>
    <div class="text-center">
      <span class="block text-base font-medium" :class="canAdd ? 'text-textc' : 'text-muted'">
        {{ canAdd ? t('actions.addEntry') : t('warnings.fillTimesFirst') }}
      </span>
      <span class="mt-1 block text-sm text-muted">{{ t(hintKey) }}</span>
    </div>
  </button>
</template>