<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from '@lucide/vue'
import { applyLocale } from '../i18n'
import type { LocaleCode } from '../types/calculator'
import flagSa from '../assets/flags/sa.svg'
import flagUs from '../assets/flags/us.svg'
import flagNl from '../assets/flags/nl.svg'

const { locale } = useI18n()

const languages: { code: LocaleCode; flag: string; label: string }[] = [
  { code: 'ar', flag: flagSa, label: 'عربي' },
  { code: 'en', flag: flagUs, label: 'English' },
  { code: 'nl', flag: flagNl, label: 'Nederlands' },
]

const open = ref(false)
const el = ref<HTMLElement | null>(null)

const currentCode = computed(() => locale.value)
const current = computed(() => languages.find((l) => l.code === currentCode.value) ?? languages[0])
const isRtl = computed(() => currentCode.value === 'ar')

function onDocClick(event: MouseEvent) {
  const target = event.target
  if (el.value && target instanceof Node && !el.value.contains(target)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

function select(code: LocaleCode) {
  applyLocale(code)
  open.value = false
}
</script>

<template>
  <div ref="el" class="relative">
    <button
      type="button"
      class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition bg-card text-textc border-inputb hover:border-accent"
      @click="open = !open"
    >
      <img :src="current.flag" class="w-5 h-4 object-cover rounded-sm" alt="" />
      <ChevronDown
        class="h-4 w-4 transition-transform"
        :class="open ? 'rotate-180' : ''"
        :stroke-width="2"
        aria-hidden="true"
      />
    </button>
    <div
      v-if="open"
      class="absolute mt-1 rounded-lg border border-inputb bg-card shadow-lg z-50 min-w-max overflow-hidden"
      :class="isRtl ? 'left-0' : 'right-0'"
    >
      <button
        v-for="lang in languages"
        :key="lang.code"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition text-left"
        :class="
          currentCode === lang.code ? 'bg-accent text-white' : 'text-textc hover:bg-accent/10'
        "
        @click="select(lang.code)"
      >
        <img :src="lang.flag" class="w-5 h-4 object-cover rounded-sm" alt="" />
        {{ lang.label }}
      </button>
    </div>
  </div>
</template>