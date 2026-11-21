import type { User } from 'firebase/auth'

export interface PersonName {
  firstName: string
  lastName: string
}

export function splitDisplayName(displayName: string): PersonName {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { firstName: '', lastName: '' }
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  }
}

export function extractGoogleNames(user: User): PersonName {
  const fromUser = user.displayName?.trim()
  if (fromUser) return splitDisplayName(fromUser)

  const google = user.providerData.find((p) => p.providerId === 'google.com')
  const fromGoogle = google?.displayName?.trim()
  if (fromGoogle) return splitDisplayName(fromGoogle)

  return { firstName: '', lastName: '' }
}

export function formatPersonName(name: PersonName): string {
  return [name.firstName.trim(), name.lastName.trim()].filter(Boolean).join(' ')
}

/** Prefer stored profile name, then Google display name, then email. */
export function getUserDisplayName(
  user: User,
  profile?: Partial<PersonName>,
): string {
  const fromProfile = formatPersonName({
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
  })
  if (fromProfile) return fromProfile

  const fromUser = user.displayName?.trim()
  if (fromUser) return fromUser

  const google = user.providerData.find((p) => p.providerId === 'google.com')
  const fromGoogle = google?.displayName?.trim()
  if (fromGoogle) return fromGoogle

  return user.email?.trim() ?? ''
}

export function isGoogleAccount(user: User): boolean {
  return user.providerData.some((p) => p.providerId === 'google.com')
}

export function isEmailPasswordAccount(user: User): boolean {
  return user.providerData.some((p) => p.providerId === 'password')
}