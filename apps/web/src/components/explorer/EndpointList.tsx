import type { Endpoint } from '@/types'

type Props = {
    endpoints: Endpoint[]
    selected: Endpoint | null
    onSelect: (ep: Endpoint) => void
}

export function EndpointList({ endpoints, selected, onSelect }: Props) {
    if (endpoints.length === 0) {
        return (
            <div className="explorer-endpoint-list" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No endpoints found</span>
            </div>
        )
    }

    return (
        <div className="explorer-endpoint-list">
            {endpoints.map((ep, i) => {
                const isSelected = selected?.path === ep.path && selected?.method === ep.method
                return (
                    <div
                        key={i}
                        className={`endpoint-item ${isSelected ? 'active' : ''}`}
                        onClick={() => onSelect(ep)}
                    >
                        <span className={`method-badge method-${ep.method.toLowerCase()}`}>
                            {ep.method}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="endpoint-path">{ep.path}</div>
                            {ep.summary && <div className="endpoint-summary">{ep.summary}</div>}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}