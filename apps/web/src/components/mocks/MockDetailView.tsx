'use client'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mocksApi, type MockServer } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { ArrowLeft, Play, Square, Trash2, Clock, Globe, Tag } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { CopyButton } from '../shared/CopyButton'
import { StatusBadge } from '../shared/StatusBadge'
import { SandboxAnalyticsPanel } from './SandboxAnalyticsPanel'
import { DateDisplay } from '../shared/DateDisplay'

export function MockDetailView({ initialMock }: { initialMock: MockServer }) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [deleteOpen, setDeleteOpen] = useState(false)

    const { data: mock } = useQuery({
        queryKey: queryKeys.mocks.detail(initialMock.id),
        queryFn: () => mocksApi.get(initialMock.id),
        initialData: initialMock,
        refetchInterval: (query) => {
            const status = query.state.data?.status
            if (status === 'RUNNING' || status === 'FAILED' || status === 'STOPPED') return false
            return 2000
        },
    })

    const startMutation = useMutation({
        mutationFn: () => mocksApi.start(mock.id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.mocks.detail(mock.id) }),
    })

    const stopMutation = useMutation({
        mutationFn: () => mocksApi.stop(mock.id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.mocks.detail(mock.id) }),
    })

    const deleteMutation = useMutation({
        mutationFn: () => mocksApi.delete(mock.id),
        onSuccess: () => router.push('/mocks'),
    })

    return (
        <div style={{ maxWidth: '100%' }}>
            <button
                onClick={() => router.push('/mocks')}
                className="btn-secondary"
                style={{ height: '28px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
                <ArrowLeft size={12} /> Mock Servers
            </button>

            <div className="page-header">
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: '16px',
                    gap: '16px',
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 className="page-title" style={{ marginBottom: 0 }}>
                                {mock.spec.name}
                            </h1>
                            <StatusBadge status={mock.status} />
                        </div>
                        {mock.label && (
                            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <Tag size={12} /> {mock.label}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {mock.status === 'STOPPED' && (
                            <button className="btn-secondary" onClick={() => startMutation.mutate()} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }} disabled={startMutation.isPending}>
                                <Play size={13} style={{ marginRight: '6px' }} />
                                Start
                            </button>
                        )}
                        {mock.status === 'RUNNING' && (
                            <button className="btn-secondary" onClick={() => stopMutation.mutate()} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }} disabled={stopMutation.isPending}>
                                <Square size={13} style={{ marginRight: '6px' }} />
                                Stop
                            </button>
                        )}
                        <button className="btn-destructive" onClick={() => setDeleteOpen(true)} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}>
                            <Trash2 size={13} style={{ marginRight: '6px' }} />
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', }}>
                <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Public URL</div>
                    {mock.publicUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', color: 'var(--color-text-strong)' }}>
                                {mock.publicUrl}
                            </span>
                            <CopyButton value={mock.publicUrl} />
                        </div>
                    ) : (
                        <span style={{ color: 'var(--color-text-subtle)', fontSize: '13px' }}>
                            {mock.status === 'BUILDING' ? 'Provisioning URL...' : 'No URL assigned'}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '32px' }}>
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginBottom: '4px' }}>Spec</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{mock.spec.name}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginBottom: '4px' }}>Version</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>v{mock?.specVersion?.version}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginBottom: '4px' }}>Created</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                            <DateDisplay date={mock.createdAt} />
                            {/* {new Date(mock.createdAt).toLocaleDateString()} */}
                        </div>
                    </div>
                    {mock.expiresAt && (
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginBottom: '4px' }}>Expires</div>
                            <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ExpiryCountdown expiresAt={mock.expiresAt} />
                            </div>
                        </div>
                    )}
                    {mock.sharePageEnabled && (
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginBottom: '4px' }}>Share Page</div>
                            <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <a
                                    href={`/sandbox/${mock.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#22c55e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <Globe size={12} /> View share page
                                </a>
                                <CopyButton value={`${typeof window !== 'undefined' ? window.location.origin : ''}/sandbox/${mock.id}`} />
                            </div>
                        </div>
                    )}
                </div>

                {mock.description && (
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{mock.description}</div>
                    </div>
                )}
            </div>

            {/* Sandbox Analytics — show for any mock with sandbox features */}
            {/* {(mock.expiresAt || mock.label || mock.sharePageEnabled) && ( */}
            <SandboxAnalyticsPanel mockId={mock.id} />
            {/* )} */}

            <ConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                title="Delete mock server"
                description={`Permanently delete the mock server for "${mock.spec.name} v${mock.specVersion.version}". This cannot be undone.`}
                confirmWord="DELETE"
                variant="destructive"
                onConfirm={() => deleteMutation.mutateAsync()}
            />
        </div>
    )
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) {
        return <span style={{ color: 'var(--color-destructive)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Expired</span>
    }
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    const color = days <= 3 ? 'var(--color-destructive)' : days <= 7 ? '#eab308' : 'var(--color-text)'
    return (
        <span style={{ color, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Expires in {days} day{days !== 1 ? 's' : ''}
        </span>
    )
}