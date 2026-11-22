export type PasswordRuleId = 'minLength' | 'lower' | 'upper' | 'number' | 'special'

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong'

const RULE_TESTS: Record<PasswordRuleId, (pw: string) => boolean> = {
  minLength: (pw) => pw.length >= 8,
  lower: (pw) => /[a-z]/.test(pw),
  upper: (pw) => /[A-Z]/.test(pw),
  number: (pw) => /\d/.test(pw),
  special: (pw) => /[^A-Za-z0-9]/.test(pw),
}

export const PASSWORD_RULE_IDS: PasswordRuleId[] = [
  'minLength',
  'lower',
  'upper',
  'number',
  'special',
]

export function passwordRuleMet(id: PasswordRuleId, password: string): boolean {
  return RULE_TESTS[id](password)
}

export function analyzePassword(password: string): {
  metCount: number
  total: number
  rules: Record<PasswordRuleId, boolean>
  level: PasswordStrengthLevel
  percent: number
} {
  const rules = {} as Record<PasswordRuleId, boolean>
  let metCount = 0
  for (const id of PASSWORD_RULE_IDS) {
    const met = passwordRuleMet(id, password)
    rules[id] = met
    if (met) metCount += 1
  }

  const total = PASSWORD_RULE_IDS.length
  const percent = password ? Math.round((metCount / total) * 100) : 0

  let level: PasswordStrengthLevel = 'empty'
  if (password.length > 0) {
    if (metCount <= 2) level = 'weak'
    else if (metCount === 3) level = 'fair'
    else if (metCount === 4) level = 'good'
    else level = 'strong'
  }

  return { metCount, total, rules, level, percent }
}

export function meetsSignUpPasswordRules(password: string): boolean {
  return PASSWORD_RULE_IDS.every((id) => passwordRuleMet(id, password))
}