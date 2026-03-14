'use client'
import { useRouter } from 'next/navigation'
import type { SpecVersion } from '@/lib/api-client'

type Props = { specId: string; versions: SpecVersion[] }

export function VersionHistoryTable({ specId, versions }: Props) {
    const router = useRouter()

    if (versions.length === 0) {
        return (
            <div style={{ padding: '24px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No versions yet.
            </div>
        )
    }

    const sorted = [...versions].sort((a, b) => b.version - a.version)

    return (
        <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            overflowX: 'auto',
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                        <th style={thStyle}>Version</th>
                        <th style={thStyle}>Uploaded</th>
                        <th style={thStyle}>Format</th>
                        <th style={thStyle}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((v, i) => {
                        const prev = sorted[i + 1]
                        return (
                            <tr key={v.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={tdStyle}>
                                    <span style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 500, color: 'var(--color-text-strong)' }}>
                                        v{v.version}
                                    </span>
                                    {i === 0 && (
                                        <span style={{ marginLeft: '8px', fontSize: '10px', padding: '1px 5px', background: 'var(--color-primary-muted)', color: 'var(--color-logo-line)', borderRadius: '4px' }}>
                                            latest
                                        </span>
                                    )}
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>
                                        {new Date(v.createdAt).toLocaleDateString()}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                        {v.format}
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, display: 'flex', gap: '8px' }}>
                                    {prev && (
                                        <button
                                            className="btn-secondary"
                                            style={{ height: '28px', fontSize: '12px' }}
                                            onClick={() => router.push(`/diff?specId=${specId}&v1=${prev.version}&v2=${v.version}`)}
                                        >
                                            View diff
                                        </button>
                                    )}
                                    <button
                                        className="btn-secondary"
                                        style={{ height: '28px', fontSize: '12px' }}
                                        onClick={() => router.push(`/mocks?specId=${specId}&specVersionId=${v.id}`)}
                                    >
                                        Deploy mock
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

const thStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'var(--color-text-subtle)', padding: '10px 16px' }
const tdStyle: React.CSSProperties = { fontSize: '13px', color: 'var(--color-text)', padding: '14px 16px' }