import { useState } from 'react'
import type { ExplorerResponse } from './ExplorerView'

function statusColor(code: number) {
    if (code >= 500) return 'var(--color-status-failed)'
    if (code >= 400) return 'var(--color-warning)'
    if (code >= 300) return 'var(--color-text-muted)'
    return 'var(--color-status-running)'
}

export function ResponsePanel({ response }: { response: ExplorerResponse }) {
    const [headersOpen, setHeadersOpen] = useState(false)

    if (response.error) {
        return (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-status-failed)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--color-status-failed)', fontFamily: 'var(--font-family-mono)' }}>
                    {response.error}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px' }}>{response.duration}ms</div>
            </div>
        )
    }

    return (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: statusColor(response.status!) }}>
                    {response.status}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{response.statusText}</span>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-text-subtle)' }}>{response.duration}ms</span>
            </div>

            {response.headers && (
                <div style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => setHeadersOpen(o => !o)}
                        style={{ width: '100%', textAlign: 'left', padding: '8px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--color-text-muted)' }}
                    >
                        {headersOpen ? '▾' : '▸'} Response Headers
                    </button>
                    {headersOpen && (
                        <pre style={{ margin: 0, padding: '8px 16px 12px', fontFamily: 'var(--font-family-mono)', fontSize: '11px', color: 'var(--color-text-muted)', overflowX: 'auto', background: 'var(--color-bg)' }}>
                            {Object.entries(response.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}
                        </pre>
                    )}
                </div>
            )}

            <pre style={{ margin: 0, padding: '16px', fontFamily: 'var(--font-family-mono)', fontSize: '12px', color: 'var(--color-text)', overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                {typeof response.body === 'string'
                    ? response.body
                    : JSON.stringify(response.body, null, 2)}
            </pre>
        </div>
    )
}