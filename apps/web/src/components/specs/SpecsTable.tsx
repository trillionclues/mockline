import type { Spec } from '@/lib/api-client'
import { MoreHorizontal } from 'lucide-react'

export function SpecsTable({ specs }: { specs: Spec[] }) {
    return (
        <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            overflowX: 'auto',
        }}>
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
            }}>
                <thead>
                    <tr style={{
                        borderBottom: '1px solid var(--color-border)',
                        background: 'var(--color-surface-2)',
                    }}>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Versions</th>
                        <th style={thStyle}>Mocks</th>
                        <th style={thStyle}>Added</th>
                        <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {specs.map((spec) => (
                        <tr key={spec.id} style={{
                            borderBottom: '1px solid var(--color-border)',
                            transition: 'background 120ms ease',
                        }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                            <td style={tdStyle}>
                                <div style={{
                                    fontFamily: 'var(--font-family-heading)',
                                    fontWeight: 500,
                                    color: 'var(--color-text-strong)',
                                    marginBottom: '2px',
                                }}>
                                    {spec.name}
                                </div>
                                <div style={{
                                    fontFamily: 'var(--font-family-mono)',
                                    fontSize: '11px',
                                    color: 'var(--color-text-muted)',
                                }}>
                                    {spec.id.substring(0, 8)}
                                </div>
                            </td>
                            <td style={tdStyle}>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '2px 8px',
                                    background: 'var(--color-surface-2)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    color: 'var(--color-text-subtle)',
                                }}>
                                    {spec.versions?.length ?? 0}
                                </span>
                            </td>
                            <td style={tdStyle}>
                                <span style={{ color: 'var(--color-text-muted)' }}>
                                    {spec._count?.mockServers ?? 0}
                                </span>
                            </td>
                            <td style={tdStyle}>
                                <span style={{ color: 'var(--color-text-muted)' }}>
                                    {new Date(spec.createdAt).toLocaleDateString()}
                                </span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <button style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    transition: 'color 120ms ease',
                                }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-strong)' }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)' }}
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

const thStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-sans)',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--color-text-subtle)',
    padding: '12px 24px',
}

const tdStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-sans)',
    fontSize: '14px',
    color: 'var(--color-text)',
    padding: '16px 24px',
}
