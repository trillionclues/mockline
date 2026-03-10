type MockServerStatus = 'RUNNING' | 'BUILDING' | 'STOPPED' | 'FAILED'

const STATUS_CONFIG = {
    RUNNING: { label: 'Running', dot: '#3fb950', bg: '#0d2b17', text: '#3fb950' },
    BUILDING: { label: 'Building', dot: '#d29922', bg: '#2b1f0a', text: '#d29922' },
    STOPPED: { label: 'Stopped', dot: '#6b6b6b', bg: '#1c1c1c', text: '#6b6b6b' },
    FAILED: { label: 'Failed', dot: '#f85149', bg: '#2d0f0f', text: '#f85149' },
} as const

export function StatusBadge({ status }: { status: MockServerStatus }) {
    const config = STATUS_CONFIG[status]
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
            style={{ background: config.bg, color: config.text }}
        >
            {status === 'BUILDING' ? (
                <svg className="animate-spin" width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <circle cx="5" cy="5" r="4" stroke={config.dot} strokeWidth="1.5" strokeDasharray="12 6" />
                </svg>
            ) : (
                <span className="block w-[6px] h-[6px] rounded-full" style={{ background: config.dot }} />
            )}
            {config.label}
        </span>
    )
}
