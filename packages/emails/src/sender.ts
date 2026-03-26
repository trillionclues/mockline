import { Resend } from 'resend'
import { paymentFailureTemplate } from './templates/payment-failure'
import { waitlistConfirmationTemplate } from './templates/waitlist'
import { welcomeTemplate } from './templates/welcome'
import { subscriptionSuccessTemplate } from './templates/subscription-success'
import { subscriptionCancelledTemplate } from './templates/subscription-cancelled'
import { subscriptionExpiredTemplate } from './templates/subscription-expired'

// Note: Ensure RESEND_API_KEY and RESEND_FROM_EMAIL are set in the environment
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'support@mockline.xyz'

export async function sendPaymentFailureEmail(userEmail: string, userName?: string | null) {
    try {
        await resend.emails.send({
            from: `Mockline <${FROM_EMAIL}>`,
            to: userEmail,
            subject: 'Action required: Your Mockline payment failed',
            html: paymentFailureTemplate(userName),
        })

        // Notify admin
        await resend.emails.send({
            from: `Mockline <${FROM_EMAIL}>`,
            to: FROM_EMAIL,
            subject: `Payment failure: ${userEmail}`,
            html: `<p><strong>${userName ?? 'Someone'}</strong> (${userEmail}) just failed to make a payment.</p>`,
        })

    } catch (err) {
        console.error('[email] Failed to send payment failure email:', err)
    }
}

export async function sendWaitlistEmail(userEmail: string, userName?: string | null) {
    try {
        await resend.emails.send({
            from: `Mockline <${FROM_EMAIL}>`,
            to: userEmail,
            subject: "You're on the Mockline waitlist",
            html: waitlistConfirmationTemplate(userName),
        })

        // Notify admins
        await resend.emails.send({
            from: `Mockline Waitlist <${FROM_EMAIL}>`,
            to: FROM_EMAIL,
            subject: `New waitlist signup: ${userEmail}`,
            html: `<p><strong>${userName ?? 'Someone'}</strong> (${userEmail}) just joined the waitlist.</p>`,
        })

        // console.log('[email] Waitlist email sent to', userEmail)
    } catch (err) {
        console.error('[email] Failed to send waitlist confirmation email:', err)
    }
}

export async function sendWelcomeEmail(userEmail: string, userName?: string | null) {
    try {
        await resend.emails.send({
            from: `Mockline <${FROM_EMAIL}>`,
            to: userEmail,
            subject: 'Welcome to Mockline 🚀',
            html: welcomeTemplate(userName),
        })

        // Notify admin
        await resend.emails.send({
            from: `Mockline <${FROM_EMAIL}>`,
            to: FROM_EMAIL,
            subject: `Welcome: ${userEmail}`,
            html: `<p><strong>${userName ?? 'Someone'}</strong> (${userEmail}) just joined the mockline.</p>`,
        })

    } catch (err) {
        console.error('[email] Failed to send welcome mail:', err)
    }
}

export async function sendSubscriptionPaymentSuccessEmail(userEmail: string, userName?: string | null) {
    try {
        await resend.emails.send({
            from: `Mockline <${FROM_EMAIL}>`,
            to: userEmail,
            subject: 'Your Mockline Subscription is Active',
            html: subscriptionSuccessTemplate(userName),
        })
    } catch (err) {
        console.error('[email] Failed to send subscription success email:', err)
    }
}

export async function sendSubscriptionCancelledEmail(userEmail: string, userName?: string | null) {
    try {
        await resend.emails.send({
            from: `Mockline <${FROM_EMAIL}>`,
            to: userEmail,
            subject: 'Your Mockline Subscription has been Cancelled',
            html: subscriptionCancelledTemplate(userName),
        })
    } catch (err) {
        console.error('[email] Failed to send subscription cancelled email:', err)
    }
}

export async function sendSubscriptionExpiredEmail(userEmail: string, userName?: string | null) {
    try {
        await resend.emails.send({
            from: `Mockline <${FROM_EMAIL}>`,
            to: userEmail,
            subject: 'Action required: Your Mockline Subscription Expired',
            html: subscriptionExpiredTemplate(userName),
        })
    } catch (err) {
        console.error('[email] Failed to send subscription expired email:', err)
    }
}
