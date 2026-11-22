<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check } from '@lucide/vue'
import {
  PASSWORD_RULE_IDS,
  analyzePassword,
  type PasswordRuleId,
  type PasswordStrengthLevel,
} from '../utils/passwordStrength'

const props = defineProps<{
  password: string
}>()

const { t } = useI18n()

const analysis = computed(() => analyzePassword(props.password))

const strengthLabel = computed(() => {
  const level: PasswordStrengthLevel = analysis.value.level
  if (level === 'empty') return ''
  return t(`auth.passwordStrength.${level}`)
})

const barColor = computed(() => {
  switch (analysis.value.level) {
    case 'weak':
      return 'bg-red-500'
    case 'fair':
      return 'bg-amber-500'
    case 'good':
      return 'bg-yellow-500'
    case 'strong':
      return 'bg-emerald-500'
    default:
      return 'bg-inputb'
  }
})
</script>

<template>
  <div class="mb-4 space-y-3">
    <div>
      <div class="mb-1.5 flex items-center justify-between gap-2">
        <span class="text-[0.625rem] font-semibold uppercase tracking-wide text-muted">
          {{ t('auth.passwordStrength.label') }}
        </span>
        <span
          v-if="strengthLabel"
          class="text-[0.6875rem] font-semibold"
          :class="{
            'text-red-600': analysis.level === 'weak',
            'text-amber-600': analysis.level === 'fair',
            'text-yellow-700': analysis.level === 'good',
            'text-emerald-600': analysis.level === 'strong',
          }"
        >
          {{ strengthLabel }}
        </span>
      </div>
      <div
        class="h-2 overflow-hidden rounded-full bg-input"
        role="progressbar"
        :aria-valuenow="analysis.percent"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="strengthLabel || t('auth.passwordStrength.label')"
      >
        <div
          class="h-full rounded-full transition-all duration-300 ease-out"
          :class="barColor"
          :style="{ width: `${Math.max(analysis.percent, password.length ? 8 : 0)}%` }"
        />
      </div>
    </div>

    <ul class="grid gap-1.5" :aria-label="t('auth.passwordRules.title')">
      <li
        v-for="ruleId in PASSWORD_RULE_IDS"
        :key="ruleId"
        class="flex items-center gap-2 text-xs"
        :class="analysis.rules[ruleId as PasswordRuleId] ? 'text-emerald-700' : 'text-muted'"
      >
        <span
          class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
          :class="
            analysis.rules[ruleId as PasswordRuleId]
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-inputb bg-card'
          "
        >
          <Check
            v-if="analysis.rules[ruleId as PasswordRuleId]"
            class="h-2.5 w-2.5"
            :stroke-width="3"
            aria-hidden="true"
          />
        </span>
        <span>{{ t(`auth.passwordRules.${ruleId}`) }}</span>
      </li>
    </ul>
  </div>
</template>