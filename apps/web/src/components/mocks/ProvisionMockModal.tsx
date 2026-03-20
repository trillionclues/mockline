'use client'
import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { specsApi, mocksApi, type Spec } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { useTierGuard } from '@/hooks/useTierGuard'
import { TierBadge } from '@/components/shared/TierBadge'
import { useUpgradeModal } from '@/contexts/upgrade-modal'

type Props = {
    open: boolean
    onClose: () => void
    specs: Spec[]
    prefilledSpecId?: string
    prefilledSpecVersionId?: string
}

export function ProvisionMockModal({ open, onClose, specs, prefilledSpecId, prefilledSpecVersionId }: Props) {
    const [specId, setSpecId] = useState(prefilledSpecId ?? '')
    const [specVersionId, setSpecVersionId] = useState(prefilledSpecVersionId ?? '')
    const [error, setError] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const { canAccess } = useTierGuard()
    const { open: openUpgrade } = useUpgradeModal()
    const isProUser = canAccess('PRO')

    const [stateful, setStateful] = useState(false)
    const [delay, setDelay] = useState('')
    const [errorRate, setErrorRate] = useState('')

    useEffect(() => {
        if (prefilledSpecId) setSpecId(prefilledSpecId)
        if (prefilledSpecVersionId) setSpecVersionId(prefilledSpecVersionId)
    }, [prefilledSpecId, prefilledSpecVersionId])

    useEffect(() => {
        if (!prefilledSpecVersionId) setSpecVersionId('')
    }, [specId])

    const { data: versions } = useQuery({
        queryKey: queryKeys.specs.versions(specId),
        queryFn: () => specsApi.getVersions(specId),
        enabled: !!specId,
    })

    const mutation = useMutation({
        mutationFn: () => mocksApi.provision({
            specId,
            specVersionId,
            stateful: isProUser ? stateful : false,
            ...(isProUser && {
                contourOptions: {
                    stateful: stateful || undefined,
                    delay: delay || undefined,
                    errorRate: errorRate ? parseInt(errorRate) : undefined,
                }
            }),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.mocks.all() })
            setSpecId('')
            setSpecVersionId('')
            setStateful(false)
            setDelay('')
            setErrorRate('')
            setError(null)
            onClose()
        },
        onError: (err: Error) => setError(err.message),
    })

    if (!open) return null

    const canSubmit = !!specId && !!specVersionId && !mutation.isPending

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2 className="modal-title">Deploy Mock Server</h2>
                <p className="modal-subtitle">Provision a live mock API from an OpenAPI spec version.</p>

                {error && (
                    <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-destructive)', borderRadius: '6px', color: 'var(--color-destructive)', fontSize: '13px' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-field">
                        <label className="form-label">Specification</label>
                        <select value={specId} onChange={e => setSpecId(e.target.value)} className="form-select">
                            <option value="">Select a spec...</option>
                            {specs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="form-field">
                        <label className="form-label">Version</label>
                        <select
                            value={specVersionId}
                            onChange={e => setSpecVersionId(e.target.value)}
                            disabled={!specId || !versions}
                            className="form-select"
                        >
                            <option value="">{!specId ? 'Select a spec first' : 'Select a version...'}</option>
                            {versions?.map(v => <option key={v.id} value={v.id}>v{v.version}</option>)}
                        </select>
                    </div>

                    <div style={{
                        marginTop: '4px',
                        padding: '16px',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                                Mock options
                            </span>
                            {!isProUser && <TierBadge tier="PRO" />}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', opacity: isProUser ? 1 : 0.4, pointerEvents: isProUser ? 'auto' : 'none' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text)' }}>
                                <input
                                    type="checkbox"
                                    checked={stateful}
                                    onChange={e => setStateful(e.target.checked)}
                                    style={{ accentColor: 'var(--color-primary)' }}
                                />
                                Stateful mode — persist changes in memory
                            </label>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div className="form-field" style={{ flex: 1 }}>
                                    <label className="form-label" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Response delay (ms range)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. 200-500"
                                        value={delay}
                                        onChange={e => setDelay(e.target.value)}
                                        style={{ height: '32px', fontSize: '12px' }}
                                    />
                                </div>
                                <div className="form-field" style={{ flex: 1 }}>
                                    <label className="form-label" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Error rate (%)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0–100"
                                        min="0"
                                        max="100"
                                        value={errorRate}
                                        onChange={e => setErrorRate(e.target.value)}
                                        style={{ height: '32px', fontSize: '12px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {!isProUser && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault()
                                    openUpgrade()
                                }}
                                style={{
                                    marginTop: '10px',
                                    fontSize: '12px',
                                    color: 'var(--color-primary)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                Upgrade to PRO to unlock these options →
                            </button>
                        )}
                    </div>
                </div>

                <div className="modal-actions">
                    <button onClick={() => {
                        onClose();
                        setSpecId('');
                        setSpecVersionId('');
                        setStateful(false);
                        setDelay('');
                        setErrorRate('');
                        setError(null);
                    }} disabled={mutation.isPending} className="btn-secondary">Cancel</button>
                    <button onClick={() => mutation.mutate()} disabled={!canSubmit} className="btn-primary" style={{ background: 'var(--color-logo-line)', color: 'var(--color-bg)' }}>
                        {mutation.isPending ? 'Deploying...' : 'Deploy Mock'}
                    </button>
                </div>
            </div>
        </div>
    )
}