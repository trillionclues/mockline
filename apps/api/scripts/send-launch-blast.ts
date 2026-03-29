// Launch Email Blast — sends the launch announcement to all Resend contacts.
// Usage:
//   pnpm --filter api blast:launch              # send for real
//   pnpm --filter api blast:launch:dry          # preview without sending
//  Tuesday March 31 at ~10am WAT

import { db } from '@mockline/db'
import { sendLaunchEmail, getMailer } from '@mockline/emails'

const DELAY_MS = 500 // ms between sends to avoid rate limits

interface ResendContact {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    unsubscribed: boolean
}

async function main() {
    const isDryRun = process.argv.includes('--dry-run')

    const audienceId = "47c64556-0e03-4fa5-9c5d-66aff21bd423"
    if (!audienceId) {
        console.error('RESEND_AUDIENCE_ID is required (Segment/Audience ID)')
        process.exit(1)
    }

    const { resend } = getMailer()

    console.log(`\n🚀 Mockline Launch Blast ${isDryRun ? '(DRY RUN)' : '(LIVE)'}\n`)

    // Fetch all contacts from Resend audience (paginated)
    const allContacts: ResendContact[] = []
    let hasMore = true
    let after: string | undefined = undefined

    while (hasMore) {
        const { data, error } = await resend.contacts.list({
            audienceId,
            ...(after ? { after } : {})
        } as Parameters<typeof resend.contacts.list>[0])

        if (error) {
            console.error('Failed to fetch contacts:', error)
            process.exit(1)
        }

        if (data?.data?.length) {
            allContacts.push(...(data.data as ResendContact[]))
            after = data.data[data.data.length - 1]?.id
        }

        hasMore = (data as any)?.has_more ?? false
    }

    // Filter out unsubscribed
    const contacts = allContacts.filter((c) => !c.unsubscribed)

    console.log(`Found ${allContacts.length} total contacts(${contacts.length} subscribed) \n`)

    let sent = 0
    let skipped = 0
    let errors = 0

    for (const contact of contacts) {
        const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || null

        if (isDryRun) {
            console.log(`  [dry - run] Would send to: ${contact.email}(${name ?? 'no name'})`)
            sent++
            continue
        }

        try {
            await sendLaunchEmail(contact.email, name)
            console.log(`Sent to: ${contact.email} `)
            sent++

            // Mark as notified in DB if they exist in waitlist_entries
            await db.waitlistEntry.updateMany({
                where: { email: contact.email, notified: false },
                data: { notified: true },
            })
        } catch (err) {
            console.error(`Failed for ${contact.email}: `, (err as Error).message)
            errors++
        }

        // Throttle
        await new Promise((r) => setTimeout(r, DELAY_MS))
    }

    console.log(`\n-- - Summary-- - `)
    console.log(`Total contacts: ${contacts.length} `)
    console.log(`Sent:     ${sent} `)
    console.log(`Skipped:  ${skipped} `)
    console.log(`Errors:   ${errors} `)
    console.log(`Mode:     ${isDryRun ? 'DRY RUN (nothing actually sent)' : 'LIVE'} `)
}

main().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
})
