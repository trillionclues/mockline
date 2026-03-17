import { ENTRIES, TAG_STYLES } from '@/lib/data/changelog';
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Changelog | Mockline',
    description: 'What\'s new in Mockline — release notes and feature updates.',
};

export default function ChangelogPage() {
    return (
        <main className="changelog-page">
            <h1 className="prose-title">Changelog</h1>
            <p className="prose-subtitle">What&apos;s new in Mockline.</p>

            <hr className="prose-divider" />

            {ENTRIES.map((entry) => (
                <article key={entry.version} className="changelog-entry">
                    <div className="changelog-meta">
                        <span>{entry.version}</span>
                        <span>·</span>
                        <span>{entry.date}</span>
                    </div>
                    <h2 className="changelog-title">{entry.title}</h2>
                    <p className="changelog-body">{entry.body}</p>
                    <ul className="changelog-bullets">
                        {entry.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                        ))}
                    </ul>
                    <div className="changelog-tags">
                        {entry.tags.map((tag) => {
                            const s = TAG_STYLES[tag]
                            return (
                                <span
                                    key={tag}
                                    className="changelog-tag"
                                    style={{ background: s.background, color: s.color }}
                                >
                                    {s.label}
                                </span>
                            )
                        })}
                    </div>
                </article>
            ))}
        </main>
    )
}
