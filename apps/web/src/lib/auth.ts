import { headers } from 'next/headers'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { db } from '@mockline/db'

export const auth = betterAuth({
    baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:4000',
    secret: process.env.BETTER_AUTH_SECRET ?? 'dev',
    database: prismaAdapter(db, {
        provider: 'postgresql',
    }),
    user: {
        additionalFields: {
            tier: {
                type: "string",
                defaultValue: "FREE",
                returned: true,
            },
            subscriptionStatus: {
                type: "string",
                required: false,
                returned: true,
            },
            subscriptionRenewsAt: {
                type: "date",
                required: false,
                returned: true,
            },
            subscriptionEndsAt: {
                type: "date",
                required: false,
                returned: true,
            },
        },
    },
    emailAndPassword: {
        enabled: false,
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24,     // refresh session every 24h
    },
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'],
})

export const getSession = async () => {
    return auth.api.getSession({
        headers: await headers()
    })
}
