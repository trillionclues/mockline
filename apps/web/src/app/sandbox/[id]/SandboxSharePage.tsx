'use client'

import { Copy, Check, Clock, Zap, Activity, ExternalLink } from 'lucide-react'
import { useState } from 'react'

type SharePageData = {
    id: string
    specName: string
    label: string | null
    description: string | null
    publicUrl: string | null
    status: string
    expiresAt: string | null
    createdAt: string
    endpoints: { method: string; path: string; summary?: string }[]
    analytics: { totalHits: number; uniqueEndpoints: number }
    branding: 'white-label' | 'powered-by'
}

export function SandboxSharePage({ data }: { data: SharePageData }) {
    const isExpired = data.expiresAt ? new Date(data.expiresAt).getTime() < Date.now() : false
    const isRunning = data.status === 'RUNNING'

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0f',
            color: '#e4e4e7',
            fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
        }}>
            {/* Hero */}
            <div style={{
                padding: '60px 24px 40px',
                background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 12px',
                        background: isRunning ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        border: `1px solid ${isRunning ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: isRunning ? '#22c55e' : '#ef4444',
                        marginBottom: '20px',
                    }}>
                        <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: isRunning ? '#22c55e' : '#ef4444',
                        }} />
                        {isExpired ? 'Expired' : isRunning ? 'Live' : 'Offline'}
                    </div>

                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: '#fafafa',
                        marginBottom: '8px',
                        fontFamily: 'var(--font-bricolage), system-ui, sans-serif',
                    }}>
                        {data.label ?? data.specName}
                    </h1>

                    {data.label && (
                        <div style={{ fontSize: '14px', color: '#71717a', marginBottom: '8px' }}>
                            {data.specName}
                        </div>
                    )}

                    {data.description && (
                        <p style={{ fontSize: '15px', color: '#a1a1aa', lineHeight: 1.6, marginBottom: '20px', maxWidth: '560px' }}>
                            {data.description}
                        </p>
                    )}

                    {data.publicUrl && isRunning && !isExpired && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 14px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px',
                            width: 'fit-content',
                        }}>
                            <code style={{ fontSize: '13px', color: '#a78bfa', fontFamily: 'monospace' }}>
                                {data.publicUrl}
                            </code>
                            <CopyBtn value={data.publicUrl} />
                        </div>
                    )}

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
                        <StatChip icon={<Zap size={13} />} label="Total Hits" value={data.analytics.totalHits.toLocaleString()} />
                        <StatChip icon={<Activity size={13} />} label="Endpoints" value={String(data.endpoints.length)} />
                        {data.expiresAt && !isExpired && (
                            <StatChip icon={<Clock size={13} />} label="Expires" value={daysLeft(data.expiresAt)} />
                        )}
                    </div>
                </div>
            </div>

            {/* Endpoints */}
            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>
                    Available Endpoints
                </h2>

                {data.endpoints.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#71717a', fontSize: '13px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                        No endpoints parsed from spec
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {data.endpoints.map((ep, i) => (
                            <EndpointCard
                                key={i}
                                endpoint={ep}
                                baseUrl={data.publicUrl}
                                isLive={isRunning && !isExpired}
                            />
                        ))}
                    </div>
                )}

                {/* Example curl */}
                {data.publicUrl && data.endpoints.length > 0 && isRunning && !isExpired && (
                    <div style={{ marginTop: '32px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fafafa', marginBottom: '12px' }}>
                            Quick Start
                        </h2>
                        <CurlExample
                            baseUrl={data.publicUrl}
                            endpoint={data.endpoints.find(e => e.method === 'GET') ?? data.endpoints[0]}
                        />
                    </div>
                )}
            </div>

            {/* Footer */}
            {data.branding === 'powered-by' && (
                <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    fontSize: '12px',
                    color: '#52525b',
                }}>
                    Powered by{' '}
                    <a
                        href="https://mockline.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#a78bfa', textDecoration: 'none' }}
                    >
                        Mockline
                    </a>
                </div>
            )}
        </div>
    )
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#71717a' }}>{icon}</span>
            <span style={{ fontSize: '12px', color: '#71717a' }}>{label}:</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7' }}>{value}</span>
        </div>
    )
}

function EndpointCard({ endpoint, baseUrl, isLive }: {
    endpoint: { method: string; path: string; summary?: string }
    baseUrl: string | null
    isLive: boolean
}) {
    const methodColor = getMethodColor(endpoint.method)

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            transition: 'background 120ms ease',
        }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
        >
            <span style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '11px',
                color: methodColor,
                padding: '3px 8px',
                borderRadius: '4px',
                background: `${methodColor}14`,
                border: `1px solid ${methodColor}28`,
                minWidth: '52px',
                textAlign: 'center',
            }}>
                {endpoint.method}
            </span>
            <code style={{ fontSize: '13px', color: '#e4e4e7', fontFamily: 'monospace', flex: 1 }}>
                {endpoint.path}
            </code>
            {endpoint.summary && (
                <span style={{ fontSize: '12px', color: '#71717a', flexShrink: 0, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {endpoint.summary}
                </span>
            )}
            {baseUrl && isLive && (
                <a
                    href={`${baseUrl}${endpoint.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#71717a', flexShrink: 0 }}
                    title="Open in browser"
                >
                    <ExternalLink size={13} />
                </a>
            )}
        </div>
    )
}

function CurlExample({ baseUrl, endpoint }: {
    baseUrl: string
    endpoint: { method: string; path: string }
}) {
    const curl = `curl -s ${endpoint.method !== 'GET' ? `-X ${endpoint.method} ` : ''}${baseUrl}${endpoint.path} | jq .`

    return (
        <div style={{
            position: 'relative',
            padding: '14px 16px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#a78bfa',
            overflow: 'auto',
        }}>
            <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                <CopyBtn value={curl} />
            </div>
            <span style={{ color: '#71717a' }}>$</span> {curl}
        </div>
    )
}

function CopyBtn({ value }: { value: string }) {
    const [copied, setCopied] = useState(false)

    return (
        <button
            onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(value)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
            }}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: copied ? '#22c55e' : '#71717a',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
            }}
            title="Copy"
        >
            {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
    )
}

function getMethodColor(method: string): string {
    switch (method.toUpperCase()) {
        case 'GET': return '#22c55e'
        case 'POST': return '#3b82f6'
        case 'PUT': return '#f59e0b'
        case 'PATCH': return '#a855f7'
        case 'DELETE': return '#ef4444'
        default: return '#71717a'
    }
}

function daysLeft(expiresAt: string): string {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return `${days}d left`
}
