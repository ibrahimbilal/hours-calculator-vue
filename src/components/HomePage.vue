<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LangSwitcher from './LangSwitcher.vue'

const { t, tm, locale } = useI18n()

const features = computed(() => tm('home.features') as string[])

onMounted(() => {
  document.title = `${t('home.title')} — ${t('app.title')}`
})

watch(locale, () => {
  document.title = `${t('home.title')} — ${t('app.title')}`
})
</script>

<template>
  <div
    class="flex min-h-dvh flex-col bg-gradient-to-b from-sky-50 via-[#e8f4f8] to-slate-50"
  >
    <header
      class="flex items-center justify-between gap-3 border-b border-inputb bg-sky-50/95 px-4 py-3 backdrop-blur-sm ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]"
    >
      <h1 class="text-lg font-semibold text-accent">{{ t('home.title') }}</h1>
      <LangSwitcher />
    </header>

    <main
      class="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-10 ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]"
    >
      <div class="mb-6 flex items-center gap-3">
        <img
          src="/icons/favicon.png"
          :alt="t('app.title')"
          class="size-14 rounded-full"
          width="56"
          height="56"
        />
        <div>
          <p class="text-xl font-semibold text-textc sm:text-2xl">{{ t('app.title') }}</p>
          <p class="text-sm text-muted">{{ t('home.tagline') }}</p>
        </div>
      </div>

      <article
        class="rounded-[1.25rem] border border-accent/10 bg-card px-5 py-6 shadow-summary-card"
      >
        <p class="mb-5 text-[0.9375rem] leading-relaxed text-textc">
          {{ t('home.description') }}
        </p>

        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          {{ t('home.featuresTitle') }}
        </h2>
        <ul class="mb-6 space-y-2.5">
          <li
            v-for="(feature, index) in features"
            :key="index"
            class="flex gap-2 text-[0.9375rem] leading-relaxed text-textc"
          >
            <span class="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span>{{ feature }}</span>
          </li>
        </ul>

        <p class="mb-5 text-sm text-muted">{{ t('home.signInNote') }}</p>

        <a
          href="/"
          class="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white sm:w-auto"
        >
          {{ t('home.openApp') }}
        </a>
      </article>

      <p class="mt-6 text-center text-sm text-muted">
        <a href="/privacy" class="font-medium text-accent hover:underline">{{ t('privacy.title') }}</a>
      </p>
    </main>
  </div>
</template>