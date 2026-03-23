// Provider-agnostic webhook interface.
// Payment providers normalize their payload to this shape
// before calling handleSubscriptionEvent()`.

export interface WebhookEvent {
    event:
    | 'subscription_created'
    | 'subscription_updated'
    | 'subscription_cancelled'
    | 'subscription_expired'
    | 'subscription_payment_success'
    | 'subscription_payment_failed'
    | 'subscription_payment_recovered'
    userId: string
    subscriptionId: string
    customerId: string
    status: string
    renewsAt: string | null
    endsAt: string | null
}

export interface WebhookResult {
    success: boolean
    error?: { code: string; message: string; status: number }
}