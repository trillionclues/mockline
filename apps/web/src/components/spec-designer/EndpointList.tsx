'use client'
import type { BuilderEndpoint } from '@/lib/spec-builder/types'
import { Trash2, Plus } from 'lucide-react'

type Props = {
    endpoints: BuilderEndpoint[]
    selectedId: string | null
    onSelect: (id: string) => void
    onAdd: () => void
    onDelete: (id: string) => void
}

export function EndpointList({ endpoints, selectedId, onSelect, onAdd, onDelete }: Props) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid var(--color-border)',
                flexShrink: 0,
            }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Endpoints
                </span>
                <button className="btn-icon" onClick={onAdd} title="Add endpoint">
                    <Plus size={14} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {endpoints.length === 0 && (
                    <div style={{ padding: '16px 12px', fontSize: '12px', color: 'var(--color-text)' }}>
                        No endpoints yet
                    </div>
                )}
                {endpoints.map(ep => (
                    <div
                        key={ep.id}
                        className="endpoint-list-row"
                        onClick={() => onSelect(ep.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderLeft: `2px solid ${ep.id === selectedId ? 'var(--color-primary)' : 'transparent'}`,
                            background: ep.id === selectedId ? 'var(--color-primary-muted)' : 'transparent',
                            transition: 'background 120ms ease',
                        }}
                    >
                        <span className={`method-badge method-${ep.method.toLowerCase()}`} style={{ flexShrink: 0 }}>
                            {ep.method}
                        </span>
                        <span style={{
                            fontSize: '12px',
                            color: 'var(--color-text)',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {ep.path}
                        </span>
                        <button
                            className="btn-icon destructive endpoint-delete-btn"
                            style={{ width: '20px', height: '20px', opacity: 0, flexShrink: 0 }}
                            onClick={e => { e.stopPropagation(); onDelete(ep.id) }}
                            title="Delete endpoint"
                        >
                            <Trash2 size={11} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
