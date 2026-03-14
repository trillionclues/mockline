type MockServerStatus = 'RUNNING' | 'BUILDING' | 'STOPPED' | 'FAILED'

const STATUS_CONFIG: Record<MockServerStatus, { label: string; color: string; bg: string }> = {
    RUNNING: { label: 'Running', color: 'var(--color-status-running)', bg: 'rgba(34, 197, 94, 0.08)' },
    BUILDING: { label: 'Building', color: 'var(--color-status-building)', bg: 'rgba(192, 184, 122, 0.08)' },
    STOPPED: { label: 'Stopped', color: 'var(--color-status-stopped)', bg: 'var(--color-surface-2)' },
    FAILED: { label: 'Failed', color: 'var(--color-status-failed)', bg: 'rgba(239, 68, 68, 0.08)' },
}

export function StatusBadge({ status }: { status: MockServerStatus }) {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.STOPPED

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            background: config.bg,
            color: config.color,
        }}>
            {status === 'BUILDING' ? (
                <svg
                    style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                >
                    <circle cx="5" cy="5" r="4" stroke={config.color} strokeWidth="1.5" strokeDasharray="12 6" />
                </svg>
            ) : (
                <span style={{
                    display: 'block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: config.color,
                    flexShrink: 0,
                }} />
            )}
            {config.label}
        </span>
    )
}