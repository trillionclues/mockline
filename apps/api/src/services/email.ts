import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@mockline.xyz'

// Notify user that their subscription payment failed.
// Lemon Squeezy retries automatically, but we want the user to
// know so they can update their payment method proactively.
export async function sendPaymentFailureEmail(userEmail: string, userName?: string | null) {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,'

  try {
    await resend.emails.send({
      from: `Mockline <${FROM_EMAIL}>`,
      to: userEmail,
      subject: 'Action required: Your Mockline payment failed',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <tr>
          <td align="center" style="padding-bottom:24px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:16px;font-weight:600;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">Mock</td>
                <td style="padding:0 2px;"><div style="width:1.5px;height:18px;background:#F2E3BB;border-radius:1px;"></div></td>
                <td style="font-size:16px;font-weight:600;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">ine</td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="background:#111114;border:1px solid #1a1a2e;border-radius:8px;padding:32px 28px;">
            <p style="margin:0 0 10px;font-size:20px;font-weight:700;color:#f4f4f5;letter-spacing:-0.02em;">
              Payment failed ⚠️
            </p>
            <p style="margin:0 0 20px;font-size:14px;color:#e4e4e7;line-height:1.6;">
              ${greeting}
            </p>
            <p style="margin:0 0 24px;font-size:13px;color:#e4e4e7;line-height:1.7;">
              We weren't able to process your latest Mockline subscription payment.
              We'll automatically retry over the next few days, but if the issue persists
              your account will be downgraded to the Free plan.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <td style="background:#F2E3BB;border-radius:6px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://mockline.xyz'}/settings"
                     style="display:inline-block;padding:10px 20px;font-size:13px;font-weight:600;color:#0a0a0b;text-decoration:none;">
                    Update payment method →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:12px;color:#71717a;line-height:1.6;">
              If you believe this is an error, reply to this email for help.
            </p>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-top:20px;">
            <p style="margin:0;font-size:11px;color:#3f3f46;line-height:1.8;text-align:center;">
              © ${new Date().getFullYear()} Mockline. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>
            `.trim(),
    })
    console.log('[email] Payment failure email sent to', userEmail)
  } catch (err) {
    console.error('[email] Failed to send payment failure email:', err)
  }
}
