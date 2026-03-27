import type { Metadata } from 'next'
import './globals.css'
import { Bricolage_Grotesque, Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Analytics } from '@vercel/analytics/next';

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

const SITE_URL = 'https://mockline.xyz'

export const metadata: Metadata = {
    title: {
        template: '%s | Mockline',
        default: 'Mockline — Deploy Mock API Servers from OpenAPI Specs',
    },
    description:
        'Mockline is an open-source PaaS that provisions isolated, Docker-powered mock API servers from OpenAPI specifications. Upload a spec, get a live URL in seconds.',
    keywords: [
        'mock API',
        'OpenAPI',
        'mock server',
        'API mocking platform',
        'Docker mock server',
        'API testing',
        'contract testing',
        'schema diff',
        'PaaS',
        'DevTools',
        'Contour CLI',
        'API development',
    ],
    authors: [{ name: 'Excel Nwachukwu', url: 'https://trillionclues.dev' }],
    creator: 'Mockline',
    publisher: 'Mockline',
    metadataBase: new URL(SITE_URL),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Mockline — Deploy Mock API Servers from OpenAPI Specs',
        description:
            'Upload an OpenAPI spec. Get an isolated Docker-powered mock server with a live URL in seconds. Test contracts, diff schemas, and ship faster.',
        url: SITE_URL,
        siteName: 'Mockline',
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Mockline — Mock API Servers from OpenAPI Specs',
        description:
            'Open-source PaaS for Docker-powered mock API servers. Upload a spec, get a URL.',
        creator: '@getmockline',
        site: '@getmockline',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        icon: '/favicon.svg',
    },
}

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Mockline',
    url: SITE_URL,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description:
        'Open-source PaaS that provisions isolated, Docker-powered mock API servers from OpenAPI specifications.',
    author: {
        '@type': 'Person',
        name: 'Excel Nwachukwu',
        url: 'https://trillionclues.dev',
    },
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier — 1 mock server, auto-stops after 1 hour',
    },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className={`${bricolage.variable} ${inter.variable}`}>
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body>
                <Providers>
                    {children}
                </Providers>
                <Analytics />
            </body>
        </html>
    )
}
