import { Metadata } from "next"


export const metadata: Metadata = {
    title: 'Blog | Mockline',
    description: 'Blog for Mockline',
}


export default function BlogPage() {
    return (
        <main className="prose-page">
            <h1 className="prose-title">Articles</h1>
            <p className="prose-subtitle">Coming soon...</p>
        </main>
    )
}