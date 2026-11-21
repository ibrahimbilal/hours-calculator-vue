import { createI18n } from 'vue-i18n'
import ar from './ar.json'
import en from './en.json'
import nl from './nl.json'
import type { LocaleCode } from '../types/calculator'

export const SUPPORTED_LOCALES = ['ar', 'en', 'nl'] as const satisfies readonly LocaleCode[]

const LOCALE_KEY = 'hours-calc-locale'

function isLocaleCode(value: string): value is LocaleCode {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

function detectLocale(): LocaleCode {
  const stored = localStorage.getItem(LOCALE_KEY)
  if (stored && isLocaleCode(stored)) return stored
  const browser = navigator.language?.split('-')[0]
  if (browser && isLocaleCode(browser)) return browser
  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { ar, en, nl },
})

export function applyLocale(code: string): void {
  if (!isLocaleCode(code)) return
  i18n.global.locale.value = code
  localStorage.setItem(LOCALE_KEY, code)
  const isRtl = code === 'ar'
  document.documentElement.setAttribute('lang', code)
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr')
}