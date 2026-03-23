import { db } from '@mockline/db'

// Subscription-related database operations.
export async function findUserWithBillingFields(userId: string) {
    return db.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            tier: true,
            lemonSqueezyCustomerId: true,
            lemonSqueezySubscriptionId: true,
            subscriptionStatus: true,
            subscriptionRenewsAt: true,
            subscriptionEndsAt: true,
        },
    })
}

export async function activateSubscription(
    userId: string,
    data: {
        customerId: string
        subscriptionId: string
        status: string
        renewsAt: string | null
        endsAt: string | null
    },
) {
    const isActive = data.status === 'active' || data.status === 'past_due'
    return db.user.update({
        where: { id: userId },
        data: {
            tier: isActive ? 'PRO' : 'FREE',
            lemonSqueezyCustomerId: data.customerId,
            lemonSqueezySubscriptionId: data.subscriptionId,
            subscriptionStatus: data.status,
            subscriptionRenewsAt: data.renewsAt ? new Date(data.renewsAt) : null,
            subscriptionEndsAt: data.endsAt ? new Date(data.endsAt) : null,
        },
    })
}

export async function markSubscriptionCancelled(
    userId: string,
    endsAt: string | null,
) {
    return db.user.update({
        where: { id: userId },
        data: {
            subscriptionStatus: 'cancelled',
            subscriptionEndsAt: endsAt ? new Date(endsAt) : null,
        },
    })
}

export async function expireSubscription(
    userId: string,
    endsAt: string | null,
) {
    return db.user.update({
        where: { id: userId },
        data: {
            tier: 'FREE',
            subscriptionStatus: 'expired',
            subscriptionEndsAt: endsAt ? new Date(endsAt) : null,
        },
    })
}

export async function markPaymentSuccess(
    userId: string,
    renewsAt: string | null,
) {
    return db.user.update({
        where: { id: userId },
        data: {
            subscriptionStatus: 'active',
            subscriptionRenewsAt: renewsAt ? new Date(renewsAt) : null,
        },
    })
}

export async function markSubscriptionPastDue(userId: string) {
    return db.user.update({
        where: { id: userId },
        data: { subscriptionStatus: 'past_due' },
    })
}

export async function markPaymentRecovered(
    userId: string,
    renewsAt: string | null,
) {
    return db.user.update({
        where: { id: userId },
        data: {
            subscriptionStatus: 'active',
            subscriptionRenewsAt: renewsAt ? new Date(renewsAt) : null,
        },
    })
}

export async function findUserSubscription(userId: string) {
    return db.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            lemonSqueezySubscriptionId: true,
        },
    })
}
