import { NextRequest, NextResponse } from 'next/server'
import { db } from '@mockline/db'
import { Resend } from 'resend'
import { z } from 'zod'

const WaitlistSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().max(100).optional(),
})

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL

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
    await db.waitlistEntry.create({
      data: {
        email,
        name: name ?? null,
        source: 'waitlist-page',
      },
    })

    // save to resend audience for now
    const audienceResult = await resend.contacts.create({
      email,
      firstName: name?.split(' ')[0] ?? '',
      lastName: name?.split(' ').slice(1).join(' ') ?? '',
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
    })

    if (audienceResult.error) {
      // Error code 'validation_error' with duplicate email
      const isDuplicate = audienceResult.error.message
        ?.toLowerCase()
        .includes('already exists')
      return NextResponse.json(
        { error: isDuplicate ? "You're already on the waitlist." : audienceResult.error.message },
        { status: isDuplicate ? 409 : 500 }
      )
    }

    // Send confirmation to subscriber
    await resend.emails.send({
      from: `Mockline <${RESEND_FROM_EMAIL}>`,
      to: email,
      subject: "You're on the Mockline waitlist",
      html: confirmationEmailHtml(name),
    })

    // Notify yourself
    await resend.emails.send({
      from: `Mockline Waitlist <${RESEND_FROM_EMAIL}>`,
      to: `${RESEND_FROM_EMAIL}`,
      subject: `New waitlist signup: ${email}`,
      html: `<p><strong>${name ?? 'Someone'}</strong> (${email}) just joined the waitlist.</p>`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

function confirmationEmailHtml(name?: string): string {
  const greeting = name ? `Hi ${name},` : 'Hi there,'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>You're on the Mockline waitlist 🎉</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo — centered  -->
<tr>
  <td align="center" style="padding-bottom:24px;">
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:16px;font-weight:600;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
          Mock
        </td>
        <td style="padding:0 2px;">
          <div style="width:1.5px;height:18px;background:#F2E3BB;border-radius:1px;"></div>
        </td>
        <td style="font-size:16px;font-weight:600;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
          ine
        </td>
      </tr>
    </table>
  </td>
</tr>

        <tr>
          <td style="background:#111114;border:1px solid #1a1a2e;border-radius:8px;padding:32px 28px;">

            <p style="margin:0 0 10px;font-size:20px;font-weight:700;color:#f4f4f5;letter-spacing:-0.02em;">
              You're on the list 🎉
            </p>

            <p style="margin:0 0 20px;font-size:14px;color:#e4e4e7;line-height:1.6;">
              ${greeting} 
              <br>
              Thanks for joining — we'll reach out as soon as early access opens.
            </p>

            <div style="height:1px;background:#1a1a2e;margin-bottom:20px;"></div>

            <p style="margin:0 0 24px;font-size:13px;color:#e4e4e7;line-height:1.7;">
              Mockline lets you spin up a live mock API from your OpenAPI spec in seconds —
              no waiting on the backend, no manually maintaining fake data that drifts
              from the real thing.
            </p>

            <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <td style="background:#F2E3BB;border-radius:6px;">
                  <a href="https://mockline.xyz/changelog"
                     style="display:inline-block;padding:10px 20px;font-size:13px;font-weight:600;color:#0a0a0b;text-decoration:none;">
                    View product updates →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#e4e4e7;line-height:1.6;">
              Questions? Just reply to this email.
            </p>

          </td>
        </tr>

        <tr>
          <td align="center" style="padding-top:20px;">
            <p style="margin:0;font-size:11px;color:#3f3f46;line-height:1.8;text-align:center;">
              You signed up at
              <a href="https://mockline.xyz" style="color:#52525b;text-decoration:none;">mockline.xyz</a>
              <br>
              © 2026 Mockline. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>
  `.trim()
}
