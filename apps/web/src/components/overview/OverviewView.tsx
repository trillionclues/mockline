'use client'
import Link from 'next/link'
import type { Spec, MockServer } from '@/lib/api-client'
import { StatusBadge } from '../shared/StatusBadge';

type Props = { specs: Spec[]; mocks: MockServer[] }

export function OverviewView({ specs, mocks }: Props) {
    const running = mocks.filter(m => m.status === 'RUNNING').length
    const failed = mocks.filter(m => m.status === 'FAILED').length
    const recent = [...mocks]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
                <h1 className="page-title">Overview</h1>
                <div className="overview-summary">
                    <span>
                        <span className="overview-count">{specs.length}</span>
                        <span className="overview-label"> specs</span>
                    </span>
                    <span className="overview-divider">·</span>
                    <span>
                        <span className="overview-count" style={{ color: 'var(--color-status-running)' }}>
                            {running}
                        </span>
                        <span className="overview-label"> running</span>
                    </span>
                    {failed > 0 && (
                        <>
                            <span className="overview-divider">·</span>
                            <span>
                                <span className="overview-count" style={{ color: 'var(--color-status-failed)' }}>
                                    {failed}
                                </span>
                                <span className="overview-label"> failed</span>
                            </span>
                        </>
                    )}
                </div>
            </div>

            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 className="section-title" style={{ marginBottom: 0 }}>Recent mock servers</h2>
                    <Link href="/mocks" className="view-all-link">View All</Link>
                </div>

                {recent.length === 0 ? (
                    <div className="overview-empty">
                        No mock servers yet.{' '}
                        <Link href="/mocks" className="inline-link" style={{
                            color: 'var(--color-logo-line)',
                            textDecoration: 'underline',
                        }}>Provision your first →</Link>
                    </div>
                ) : (
                    <div className="overview-mock-list">
                        {recent.map(mock => (
                            <Link key={mock.id} href={`/mocks/${mock.id}`} className="overview-mock-row">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <span className="overview-mock-name">{mock.spec.name}</span>
                                    <span className="overview-mock-spec">v{mock?.specVersion?.version}</span>
                                </div>
                                <StatusBadge status={mock.status} />
                                {mock.publicUrl && (
                                    <span
                                        className="overview-mock-url"
                                        onClick={e => e.preventDefault()}
                                    >
                                        {mock.publicUrl}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}