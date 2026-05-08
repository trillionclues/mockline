'use client'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mocksApi, type MockServer } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { Play, Square, Trash2, Clock } from 'lucide-react'
import { useState } from 'react'
import { CopyButton } from '../shared/CopyButton'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { StatusBadge } from '../shared/StatusBadge'

export function MocksTable({ mocks }: { mocks: MockServer[] }) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [deleteTarget, setDeleteTarget] = useState<MockServer | null>(null)

    const startMutation = useMutation({
        mutationFn: (id: string) => mocksApi.start(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.mocks.all() })
            const prev = queryClient.getQueryData(queryKeys.mocks.all())
            queryClient.setQueryData(queryKeys.mocks.all(), (old: MockServer[]) =>
                old.map(m => m.id === id ? { ...m, status: 'BUILDING' as const } : m)
            )
            return { prev }
        },
        onError: (_err, _id, context) => {
            if (context?.prev) queryClient.setQueryData(queryKeys.mocks.all(), context.prev)
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.mocks.all() }),
    })

    const stopMutation = useMutation({
        mutationFn: (id: string) => mocksApi.stop(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.mocks.all() })
            const prev = queryClient.getQueryData(queryKeys.mocks.all())
            queryClient.setQueryData(queryKeys.mocks.all(), (old: MockServer[]) =>
                old.map(m => m.id === id ? { ...m, status: 'STOPPED' as const } : m)
            )
            return { prev }
        },
        onError: (_err, _id, context) => {
            if (context?.prev) queryClient.setQueryData(queryKeys.mocks.all(), context.prev)
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.mocks.all() }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => mocksApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.mocks.all() })
            setDeleteTarget(null)
        },
    })

    return (
        <>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                            <th style={thStyle}>Mock</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>URL</th>
                            <th style={thStyle}>Age</th>
                            <th style={thStyle}>Expires</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mocks.map(mock => (
                            <tr
                                key={mock.id}
                                onClick={() => router.push(`/mocks/${mock.id}`)}
                                style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 120ms ease' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: 500, color: 'var(--color-text-strong)' }}>
                                        {mock.spec.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text)' }}>
                                        {mock.label
                                            ? <span style={{ color: 'var(--color-text-muted)' }}>{mock.label}</span>
                                            : mock?.specVersion?.version ? `v${mock?.specVersion?.version}` : ''}
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <StatusBadge status={mock.status} />
                                </td>
                                <td style={tdStyle}>
                                    {mock.publicUrl ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--color-text)' }}>
                                                {mock.publicUrl}
                                            </span>
                                            <CopyButton value={mock.publicUrl} />
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)' }}>
                                            {mock.status === 'BUILDING' ? 'Provisioning...' : '—'}
                                        </span>
                                    )}
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '12px', color: 'var(--color-text)' }}>
                                        {timeAgo(mock?.createdAt)}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    {mock.expiresAt ? (
                                        <ExpiryBadge expiresAt={mock.expiresAt} />
                                    ) : (
                                        <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)' }}>—</span>
                                    )}
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>
                                    <div
                                        style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {mock.status === 'STOPPED' && (
                                            <button className="btn-icon" onClick={() => startMutation.mutate(mock.id)} title="Start">
                                                <Play size={13} />
                                            </button>
                                        )}
                                        {mock.status === 'RUNNING' && (
                                            <button className="btn-icon" onClick={() => stopMutation.mutate(mock.id)} title="Stop">
                                                <Square size={13} />
                                            </button>
                                        )}
                                        <button className="btn-icon destructive" onClick={() => setDeleteTarget(mock)} title="Delete">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete mock server"
                description={`This will stop and permanently delete the mock server for "${deleteTarget?.spec.name} v${deleteTarget?.specVersion?.version}".`}
                confirmWord="DELETE"
                variant="destructive"
                onConfirm={() => deleteMutation.mutateAsync(deleteTarget!.id)}
            />
        </>
    )
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

const thStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'var(--color-text-subtle)', padding: '10px 16px' }
const tdStyle: React.CSSProperties = { fontSize: '13px', color: 'var(--color-text)', padding: '14px 16px' }

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) {
        return <span style={{ fontSize: '11px', color: 'var(--color-destructive)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} /> Expired</span>
    }
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    const color = days <= 3 ? 'var(--color-destructive)' : days <= 7 ? '#eab308' : 'var(--color-text-muted)'
    return (
        <span style={{ fontSize: '11px', color, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} /> {days}d left
        </span>
    )
}