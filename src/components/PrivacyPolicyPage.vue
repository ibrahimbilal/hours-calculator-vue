<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LangSwitcher from './LangSwitcher.vue'

const SECTION_KEYS = [
  'collect',
  'use',
  'storage',
  'thirdParty',
  'cookies',
  'retention',
  'rights',
  'children',
  'changes',
  'contact',
] as const

type PrivacyBullet = { label?: string; text: string; href?: string }
type PrivacySection = {
  title: string
  paragraphs?: string[]
  paragraphsAfter?: string[]
  bullets?: (string | PrivacyBullet)[]
}

const { t, tm, locale } = useI18n()

const sections = computed(() =>
  SECTION_KEYS.map((key) => ({
    key,
    ...(tm(`privacy.${key}`) as PrivacySection),
  })),
)

function isLabeledBullet(item: string | PrivacyBullet): item is PrivacyBullet {
  return typeof item === 'object' && item !== null && 'text' in item
}

onMounted(() => {
  document.title = `${t('privacy.title')} — ${t('app.title')}`
})

watch(locale, () => {
  document.title = `${t('privacy.title')} — ${t('app.title')}`
})
</script>

<template>
  <div
    class="flex min-h-dvh flex-col bg-gradient-to-b from-sky-50 via-[#e8f4f8] to-slate-50"
  >
    <header
      class="flex items-center justify-between gap-3 border-b border-inputb bg-sky-50/95 px-4 py-3 backdrop-blur-sm ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]"
    >
      <h1 class="text-lg font-semibold text-accent">{{ t('privacy.title') }}</h1>
      <LangSwitcher />
    </header>

    <main
      class="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-10 ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]"
    >
      <p class="mb-4 text-sm text-muted">{{ t('privacy.updated') }}</p>

      <article
        class="rounded-[1.25rem] border border-accent/10 bg-card px-5 py-6 shadow-summary-card"
      >
        <section class="mb-5 border-b border-inputb pb-5">
          <h2 class="mb-2 text-base font-semibold text-textc">
            {{ t('privacy.intro.title') }}
          </h2>
          <p class="text-[0.9375rem] leading-relaxed text-textc">
            {{ t('privacy.introLead') }}
            <a
              href="https://hours-calculator.ibrahimbilal.com/"
              class="text-accent hover:underline"
              rel="noopener noreferrer"
            >
              hours-calculator.ibrahimbilal.com
            </a>
            {{ t('privacy.introRest') }}
          </p>
        </section>

        <section
          v-for="section in sections"
          :key="section.key"
          class="mb-5 border-b border-inputb pb-5 last:mb-0 last:border-0 last:pb-0"
        >
          <h2 class="mb-2 text-base font-semibold text-textc">{{ section.title }}</h2>

          <p
            v-for="(paragraph, pi) in section.paragraphs"
            :key="`${section.key}-p-${pi}`"
            class="mb-3 text-[0.9375rem] leading-relaxed text-textc"
          >
            {{ paragraph }}
          </p>

          <ul
            v-if="section.bullets?.length"
            class="mb-3 list-disc space-y-2 ps-5 text-[0.9375rem] leading-relaxed text-textc"
          >
            <li v-for="(item, bi) in section.bullets" :key="`${section.key}-b-${bi}`">
              <template v-if="isLabeledBullet(item)">
                <strong v-if="item.label">{{ item.label }}</strong>
                {{ item.text }}
                <a
                  v-if="item.href"
                  :href="item.href"
                  class="text-accent hover:underline"
                  rel="noopener noreferrer"
                  >{{ item.href.replace(/^https?:\/\//, '') }}</a
                ><template v-if="item.href">.</template>
              </template>
              <template v-else>{{ item }}</template>
            </li>
          </ul>

          <p
            v-for="(paragraph, pi) in section.paragraphsAfter"
            :key="`${section.key}-pa-${pi}`"
            class="mb-3 text-[0.9375rem] leading-relaxed text-textc last:mb-0"
          >
            <template v-if="section.key === 'contact'">
              {{ t('privacy.contactLead') }}
              <a href="mailto:privacy@ibrahimbilal.com" class="text-accent hover:underline">
                privacy@ibrahimbilal.com
              </a>.
            </template>
            <template v-else>{{ paragraph }}</template>
          </p>

          <p
            v-if="section.key === 'contact' && !section.paragraphsAfter?.length"
            class="text-[0.9375rem] leading-relaxed text-textc"
          >
            {{ t('privacy.contactLead') }}
            <a href="mailto:privacy@ibrahimbilal.com" class="text-accent hover:underline">
              privacy@ibrahimbilal.com
            </a>.
          </p>
        </section>
      </article>

      <p class="mt-6 text-center text-sm">
        <a href="/" class="font-medium text-accent hover:underline">{{ t('privacy.back') }}</a>
      </p>
    </main>
  </div>
</template>