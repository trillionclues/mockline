// Normalizes an email address (all providers) to its canonical form to prevent
// multi-account abuse via alias variations.
// Gmail-specific: strips dots and +suffix from local part
// (user.name+alias@gmail.com → username@gmail.com)
// (user+alias@outlook.com → user@outlook.com)
export function normalizeEmail(email: string): string {
    const lower = email.toLowerCase().trim()
    const [localPart, domain] = lower.split('@')

    if (!localPart || !domain) return lower

    const isGmail = domain === 'gmail.com' || domain === 'googlemail.com'

    let normalized = localPart

    const plusIndex = normalized.indexOf('+')
    if (plusIndex !== -1) {
        normalized = normalized.slice(0, plusIndex)
    }

    if (isGmail) {
        normalized = normalized.replace(/\./g, '')
    }

    const canonicalDomain = domain === 'googlemail.com' ? 'gmail.com' : domain

    return `${normalized}@${canonicalDomain}`
}
