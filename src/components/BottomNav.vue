<script setup lang="ts">
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { BarChart3, Clock, Upload } from '@lucide/vue'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{ 'update:modelValue': [key: string] }>()

const { t } = useI18n()

const items: { key: string; label: string; icon: Component }[] = [
  { key: 'tracker', label: 'nav.tracker', icon: Clock },
  { key: 'stats', label: 'nav.stats', icon: BarChart3 },
  { key: 'import', label: 'nav.import', icon: Upload },
]

function select(key: string) {
  emit('update:modelValue', key)
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 -mb-[1px] z-[45] flex items-stretch justify-around gap-1 border-t border-inputb bg-white/90 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1.5 shadow-nav-top backdrop-blur-md"
    aria-label="Main"
  >
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="flex flex-1 flex-col items-center gap-0.5 rounded-xl border-0 px-1 py-1.5 text-[0.625rem] font-semibold transition-colors min-[400px]:text-[0.6875rem]"
      :class="
        modelValue === item.key
          ? 'bg-accent/10 text-accent'
          : 'bg-transparent text-muted'
      "
      :aria-current="modelValue === item.key ? 'page' : undefined"
      @click="select(item.key)"
    >
      <component
        :is="item.icon"
        class="h-[1.35rem] w-[1.35rem]"
        :stroke-width="2"
        aria-hidden="true"
      />
      <span class="max-w-full truncate text-center leading-tight">{{ t(item.label) }}</span>
    </button>
  </nav>
</template>