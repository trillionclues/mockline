'use client'
import { useQuery } from '@tanstack/react-query'
import { mocksApi } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { BarChart3, Activity, Clock, Zap } from 'lucide-react'
import type { SandboxAnalytics } from '@/types'

export function SandboxAnalyticsPanel({ mockId }: { mockId: string }) {
    const { data: analytics, isLoading } = useQuery({
        queryKey: queryKeys.mocks.analytics(mockId),
        queryFn: () => mocksApi.analytics(mockId),
        refetchInterval: 30_000, // refresh every 30s
    })

    if (isLoading) {
        return (
            <div style={panelStyle}>
                <div style={headerStyle}>
                    <BarChart3 size={14} />
                    <span>Usage Analytics</span>
                </div>
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-subtle)', fontSize: '13px' }}>
                    Loading analytics...
                </div>
            </div>
        )
    }

    if (!analytics) return null

    return (
        <div style={panelStyle}>
            <div style={headerStyle}>
                <BarChart3 size={14} />
                <span>Usage Analytics</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <StatCard
                    icon={<Zap size={14} />}
                    label="Total Hits"
                    value={analytics.totalHits.toLocaleString()}
                />
                <StatCard
                    icon={<Activity size={14} />}
                    label="Endpoints Hit"
                    value={String(analytics.uniqueEndpoints)}
                />
                <StatCard
                    icon={<Clock size={14} />}
                    label="Last Active"
                    value={analytics.lastActive ? timeAgo(analytics.lastActive) : 'Never'}
                />
            </div>

            {analytics.endpointBreakdown.length > 0 && (
                <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Top Endpoints
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {analytics.endpointBreakdown.slice(0, 8).map((ep, i) => (
                            <EndpointRow key={i} endpoint={ep} maxHits={analytics.endpointBreakdown[0]?.hitCount ?? 1} />
                        ))}
                    </div>
                </div>
            )}

            {analytics.totalHits === 0 && (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-subtle)', fontSize: '13px' }}>
                    No requests logged yet. Share your sandbox URL to start tracking.
                </div>
            )}
        </div>
    )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div style={{
            padding: '12px',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-subtle)', fontSize: '11px', marginBottom: '6px' }}>
                {icon}
                {label}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-strong)' }}>
                {value}
            </div>
        </div>
    )
}

function EndpointRow({ endpoint, maxHits }: {
    endpoint: SandboxAnalytics['endpointBreakdown'][0]
    maxHits: number
}) {
    const barWidth = Math.max(4, (endpoint.hitCount / maxHits) * 100)
    const methodColor = getMethodColor(endpoint.method)

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 8px',
            borderRadius: '4px',
            fontSize: '12px',
        }}>
            <span style={{
                fontFamily: 'monospace',
                fontWeight: 600,
                fontSize: '10px',
                color: methodColor,
                width: '42px',
                textAlign: 'center',
                padding: '2px 4px',
                borderRadius: '3px',
                background: `${methodColor}18`,
                flexShrink: 0,
            }}>
                {endpoint.method}
            </span>
            <span style={{ fontFamily: 'monospace', color: 'var(--color-text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {endpoint.path}
            </span>
            <div style={{ width: '80px', height: '6px', background: 'var(--color-border)', borderRadius: '3px', flexShrink: 0 }}>
                <div style={{ width: `${barWidth}%`, height: '100%', background: 'var(--color-logo-line)', borderRadius: '3px', transition: 'width 300ms ease' }} />
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-text-muted)', width: '36px', textAlign: 'right', flexShrink: 0 }}>
                {endpoint.hitCount}
            </span>
        </div>
    )
}

function getMethodColor(method: string): string {
    switch (method.toUpperCase()) {
        case 'GET': return '#22c55e'
        case 'POST': return '#3b82f6'
        case 'PUT': return '#f59e0b'
        case 'PATCH': return '#a855f7'
        case 'DELETE': return '#ef4444'
        default: return 'var(--color-text-muted)'
    }
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

const panelStyle: React.CSSProperties = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '16px',
}

const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-strong)',
    marginBottom: '16px',
}
