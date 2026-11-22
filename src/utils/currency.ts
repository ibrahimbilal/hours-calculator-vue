export const DEFAULT_CURRENCY_CODE = 'EUR'

export const CURRENCY_OPTIONS = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'MAD', symbol: 'MAD' },
  { code: 'AED', symbol: 'AED' },
  { code: 'SAR', symbol: 'SAR' },
] as const

export type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]['code']

const symbolByCode = new Map<string, string>(
  CURRENCY_OPTIONS.map((c) => [c.code, c.symbol]),
)

export function normalizeCurrencyCode(value: unknown): CurrencyCode {
  if (typeof value === 'string' && symbolByCode.has(value)) {
    return value as CurrencyCode
  }
  return DEFAULT_CURRENCY_CODE
}

export function currencySymbolFor(code: CurrencyCode | string): string {
  return symbolByCode.get(code) ?? symbolByCode.get(DEFAULT_CURRENCY_CODE)!
}

export function formatMoney(value: number, symbol: string): string {
  const amount = !value || Number.isNaN(value) ? 0 : Number(value)
  const spaced = ['CHF', 'MAD', 'AED', 'SAR'].includes(symbol)
  return spaced ? `${symbol} ${amount.toFixed(2)}` : `${symbol}${amount.toFixed(2)}`
}