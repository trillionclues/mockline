'use client'
import { useState } from 'react'
import type { ContractTestRun } from '@/lib/api-client'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { EndpointResultRow } from './EndpointResultRow'

export function ContractResultsTable({ runs }: { runs: ContractTestRun[] }) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const sorted = [...runs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
            {sorted.map(run => {
                const isOpen = expandedId === run.id
                const allPassed = run.failed === 0

                return (
                    <div key={run.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <div
                            onClick={() => setExpandedId(isOpen ? null : run.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '14px 16px',
                                cursor: 'pointer',
                                transition: 'background 120ms ease',
                                background: isOpen ? 'var(--color-surface-2)' : 'transparent',
                            }}
                            onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)' }}
                            onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                            {isOpen ? <ChevronDown size={14} color="var(--color-text-muted)" /> : <ChevronRight size={14} color="var(--color-text-muted)" />}

                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-strong)' }}>
                                    {run.baseUrl}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                    {new Date(run.createdAt).toLocaleString()}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                                <span style={{ color: 'var(--color-status-running)' }}>✓ {run.passed}</span>
                                <span style={{ color: run.failed > 0 ? 'var(--color-status-failed)' : 'var(--color-text-muted)' }}>
                                    ✗ {run.failed}
                                </span>
                                <span style={{ color: 'var(--color-text-subtle)' }}>{run.totalEndpoints} total</span>
                                <span style={{ color: 'var(--color-text-subtle)' }}>{run.duration}ms</span>
                                <span style={{
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    background: allPassed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                    color: allPassed ? 'var(--color-status-running)' : 'var(--color-status-failed)',
                                }}>
                                    {allPassed ? 'PASSED' : 'FAILED'}
                                </span>
                            </div>
                        </div>

                        {isOpen && (
                            <div style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                                {run.results.map((result, i) => (
                                    <EndpointResultRow key={i} result={result} />
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}