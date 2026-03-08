import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: {
        template: '%s | Mockline',
        default: 'Mockline — API Mocking Platform',
    },
    description: 'Instant mock API servers from your OpenAPI specs',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
