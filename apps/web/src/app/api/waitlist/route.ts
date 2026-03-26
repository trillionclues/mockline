import { NextRequest, NextResponse } from 'next/server'
// import { db } from '@mockline/db'
import { Resend } from 'resend'
import { z } from 'zod'
import { sendWaitlistEmail } from '@mockline/emails'

const WaitlistSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().max(100).optional(),
})

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const body = await request.json()
    const parsed = WaitlistSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, name } = parsed.data

    // Check if already registered
    // const existing = await db.waitlistEntry.findUnique({
    //   where: { email },
    // })

    // if (existing) {
    //   return NextResponse.json(
    //     { error: "You're already on the waitlist." },
    //     { status: 409 }
    //   )
    // }

    // Store in database
    // await db.waitlistEntry.create({
    //   data: {
    //     email,
    //     name: name ?? null,
    //     source: 'waitlist-page',
    //   },
    // })

    // save to resend audience for now
    // Save to Resend contacts
    const contactResult = await resend.contacts.create({
      email,
      firstName: name?.split(' ')[0] ?? '',
      lastName: name?.split(' ').slice(1).join(' ') ?? '',
      unsubscribed: false,
    })

    if (contactResult.error) {
      const isDuplicate = contactResult.error.message
        ?.toLowerCase()
        .includes('already exists')
      return NextResponse.json(
        { error: isDuplicate ? "You're already on the waitlist." : contactResult.error.message },
        { status: isDuplicate ? 409 : 500 }
      )
    }

    // Send confirmation to subscriber using strict package API
    await sendWaitlistEmail(email, name);

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
