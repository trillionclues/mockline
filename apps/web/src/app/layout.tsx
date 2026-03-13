import type { Metadata } from 'next'
import './globals.css'
import { Bricolage_Grotesque, Inter } from 'next/font/google'

const bricolage = Bricolage_Grotesque({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-bricolage',
    display: 'swap',
})

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
})

export const metadata: Metadata = {
    title: {
        template: '%s | Mockline',
        default: 'Mockline — Automated Mock API PaaS',
    },
    description: 'Instantly provision isolated, Docker-powered mock environments from OpenAPI specs for engineering teams.',
    keywords: [
        'API Mocking',
        'OpenAPI',
        'Docker',
        'PaaS',
        'Mock Server',
        'DevTools',
        'Testing',
        'Contour Engine'
    ],
    authors: [{ name: 'Trillionclues - Excel Nwachukwu' }],
    openGraph: {
        title: 'Mockline',
        description: 'Deploy isolated mock API containers from OpenAPI specs in seconds.',
        url: 'https://mockline.xyz',
        siteName: 'Mockline',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Mockline',
        description: 'Automated Mock API infrastructure for modern engineering teams.',
    },
    metadataBase: new URL('https://mockline.xyz'),
    icons: {
        icon: '/favicon.svg',
    },
}

import { Providers } from '@/components/providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className={`${bricolage.variable} ${inter.variable}`}>
            <body>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}
