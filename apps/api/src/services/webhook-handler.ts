import { WebhookEvent, WebhookResult } from '@/types/webhook'
import {
    findUserWithBillingFields,
    activateSubscription,
    markSubscriptionCancelled,
    expireSubscription,
    markPaymentSuccess,
    markSubscriptionPastDue,
    markPaymentRecovered,
} from '../repositories/subscription.repository'
import { sendPaymentFailureEmail } from './email'


// Provider-agnostic subscription webhook handler.
// To add new payment provider, write a normalizer that maps the provider's payload to `WebhookEvent`.
export async function handleSubscriptionEvent(
    event: WebhookEvent,
): Promise<WebhookResult> {
    const { userId } = event

    // Verify user exists and fetch email/name for notifications
    const dbUser = await findUserWithBillingFields(userId)
    if (!dbUser) {
        return {
            success: false,
            error: { code: 'USER_NOT_FOUND', message: 'User not found', status: 404 },
        }
    }

    switch (event.event) {
        // New subscription or plan change
        case 'subscription_created':
        case 'subscription_updated': {
            await activateSubscription(userId, {
                customerId: event.customerId,
                subscriptionId: event.subscriptionId,
                status: event.status,
                renewsAt: event.renewsAt,
                endsAt: event.endsAt,
            })
            break
        }

        // User cancelled — still active until period ends
        // Since they paid through the end of the billing period,
        // we just mark the status so the frontend can show "Your plan will end on [date]" instead of "Renews on".
        case 'subscription_cancelled': {
            await markSubscriptionCancelled(userId, event.endsAt)
            break
        }

        // Subscription expired (grace period ended)
        case 'subscription_expired': {
            await expireSubscription(userId, event.endsAt)
            try {
                const { handleDowngrade } = await import('./downgrade')
                await handleDowngrade(userId)
            } catch (err) {
                console.error('[webhook] Downgrade handler failed:', err)
            }
            break
        }

        // Renewal succeeded — keep tier active
        case 'subscription_payment_success': {
            await markPaymentSuccess(userId, event.renewsAt)
            break
        }

        // Payment failed — mark past due and notify user
        case 'subscription_payment_failed': {
            await markSubscriptionPastDue(userId)
            await sendPaymentFailureEmail(dbUser.email, dbUser.name)
            break
        }

        // Payment recovered — keep tier active
        case 'subscription_payment_recovered': {
            await markPaymentRecovered(userId, event.renewsAt)
            break
        }

        default:
            console.log('[webhook] Unhandled event:', event.event)
    }

    return { success: true }
}
