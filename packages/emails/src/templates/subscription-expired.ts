export function subscriptionExpiredTemplate(userName?: string | null): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,'

  return `
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
               <td style="font-size:16px;font-weight:600;color:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">Mock</td>
                <td style="padding:0 2px;"><div style="width:1.5px;height:18px;background:#0a0a0b;border-radius:1px;"></div></td>
                <td style="font-size:16px;font-weight:600;color:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">ine</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
        <td style="background:#ffffff;border:1px solid #1a1a2e;border-radius:8px;padding:32px 28px;">
            <p style="margin:0 0 20px;font-size:14px;color:#0a0a0b;line-height:1.6;">
              ${greeting}
            </p>
            <p style="margin:0 0 24px;font-size:13px;color:#0a0a0b;line-height:1.7;">
              Your Mockline subscription has expired and your account has been safely downgraded to the Free plan.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#F2E3BB;border-radius:6px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://mockline.xyz'}/settings"
                     style="display:inline-block;padding:10px 20px;font-size:13px;font-weight:600;color:#0a0a0b;text-decoration:none;">
                    Reactivate Subscription →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 24px;font-size:13px;color:#0a0a0b;line-height:1.7;">
              Whenever you're ready to get your premium features back, you can upgrade again directly from your settings.
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
    `.trim()
}
