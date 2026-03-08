import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { db } from '@mockline/db'

export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: 'postgresql',
    }),
    emailAndPassword: {
        enabled: false,
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24,     // refresh session every 24h
    },
    trustedOrigins: [process.env.CORS_ORIGIN ?? 'http://localhost:3000'],
})
