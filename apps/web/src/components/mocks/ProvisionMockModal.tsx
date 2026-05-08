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
    const isTeamUser = canAccess('TEAM')

    const [stateful, setStateful] = useState(false)
    const [delay, setDelay] = useState('')
    const [errorRate, setErrorRate] = useState('')
    const [requireAuth, setRequireAuth] = useState(false)
    const [strictValidation, setStrictValidation] = useState(false)
    const [strictLevel, setStrictLevel] = useState<'hard' | 'soft'>('hard')

    const [sandboxLabel, setSandboxLabel] = useState('')
    const [sandboxDescription, setSandboxDescription] = useState('')
    const [sharePageEnabled, setSharePageEnabled] = useState(false)
    const [expiryPreset, setExpiryPreset] = useState<'' | '7' | '14' | '30' | '90'>('')

    const maxExpiryDays = isTeamUser ? 90 : isProUser ? 14 : 0
    const hasSandboxOptions = !!(sandboxLabel || sandboxDescription || sharePageEnabled || expiryPreset)

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
                    requireAuth: requireAuth || undefined,
                    strictValidation: strictValidation || undefined,
                    strictLevel: strictValidation ? strictLevel : undefined,
                }
            }),
            ...(isProUser && hasSandboxOptions && {
                sandboxOptions: {
                    label: sandboxLabel || undefined,
                    description: sandboxDescription || undefined,
                    sharePageEnabled: sharePageEnabled || undefined,
                    expiresAt: expiryPreset
                        ? new Date(Date.now() + parseInt(expiryPreset) * 24 * 60 * 60 * 1000).toISOString()
                        : undefined,
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
            setRequireAuth(false)
            setStrictValidation(false)
            setStrictLevel('hard')
            setSandboxLabel('')
            setSandboxDescription('')
            setSharePageEnabled(false)
            setExpiryPreset('')
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
                        <select value={specId} onChange={e => setSpecId(e.target.value)} disabled={mutation.isPending} className="form-select" style={{ opacity: mutation.isPending ? 0.6 : 1 }}>
                            <option value="">Select a spec...</option>
                            {specs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="form-field">
                        <label className="form-label">Version</label>
                        <select
                            value={specVersionId}
                            onChange={e => setSpecVersionId(e.target.value)}
                            disabled={!specId || !versions || mutation.isPending}
                            className="form-select"
                            style={{ opacity: mutation.isPending ? 0.6 : 1 }}
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
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                flexDirection: 'column',
                                gap: '12px',
                                justifyContent: 'flex-start',
                                marginBottom: '12px',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    gap: '12px',
                                }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text)' }}>
                                        <input
                                            type="checkbox"
                                            checked={stateful}
                                            onChange={e => setStateful(e.target.checked)}
                                            disabled={mutation.isPending}
                                            style={{ accentColor: 'var(--color-primary)' }}
                                        />
                                        Stateful mode — Persist changes in memory
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text)' }}>
                                        <input
                                            type="checkbox"
                                            checked={requireAuth}
                                            onChange={e => setRequireAuth(e.target.checked)}
                                            disabled={mutation.isPending}
                                            style={{ accentColor: 'var(--color-primary)' }}
                                        />

                                        Require Auth
                                    </label>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text)' }}>
                                    <input
                                        type="checkbox"
                                        checked={strictValidation}
                                        onChange={e => setStrictValidation(e.target.checked)}
                                        disabled={mutation.isPending}
                                        style={{ accentColor: 'var(--color-primary)' }}
                                    />
                                    Strict Validation — Reject invalid requests
                                </label>
                            </div>
                            {strictValidation && (
                                <div className="form-field" style={{ marginTop: '4px', marginBottom: '12px' }}>
                                    <label className="form-label" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Validation level</label>
                                    <select
                                        className="form-select"
                                        value={strictLevel}
                                        onChange={e => setStrictLevel(e.target.value as 'hard' | 'soft')}
                                        disabled={mutation.isPending}
                                        style={{ height: '32px', fontSize: '12px', opacity: mutation.isPending ? 0.6 : 1 }}
                                    >
                                        <option value="hard">Hard — Reject with 400</option>
                                        <option value="soft">Soft — Warn and continue</option>
                                    </select>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '8px' }}>

                                <div className="form-field" style={{ flex: 1 }}>
                                    <label className="form-label" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Response delay (ms range)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. 200-500"
                                        value={delay}
                                        onChange={e => setDelay(e.target.value)}
                                        disabled={mutation.isPending}
                                        style={{ height: '32px', fontSize: '12px', opacity: mutation.isPending ? 0.6 : 1 }}
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
                                        disabled={mutation.isPending}
                                        style={{ height: '32px', fontSize: '12px', opacity: mutation.isPending ? 0.6 : 1 }}
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
                                    color: 'var(--color-logo-line)',
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

                    {/* Partner Sandbox Options */}
                    {(isProUser || isTeamUser) && (
                        <div style={{
                            marginTop: '4px',
                            padding: '16px',
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                                    Partner Sandbox
                                </span>
                                {!isProUser && <TierBadge tier="PRO" />}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', opacity: isProUser ? 1 : 0.4, pointerEvents: isProUser ? 'auto' : 'none' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div className="form-field" style={{ flex: 1 }}>
                                        <label className="form-label" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Sandbox label</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder='e.g. "Acme Corp Integration"'
                                            value={sandboxLabel}
                                            onChange={e => setSandboxLabel(e.target.value)}
                                            maxLength={100}
                                            disabled={mutation.isPending}
                                            style={{ height: '32px', fontSize: '12px', opacity: mutation.isPending ? 0.6 : 1 }}
                                        />
                                    </div>
                                    <div className="form-field" style={{ flex: 1 }}>
                                        <label className="form-label" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Expiry</label>
                                        <select
                                            className="form-select"
                                            value={expiryPreset}
                                            onChange={e => setExpiryPreset(e.target.value as '' | '7' | '14' | '30' | '90')}
                                            disabled={mutation.isPending}
                                            style={{ height: '34px', fontSize: '12px', opacity: mutation.isPending ? 0.6 : 1 }}
                                        >
                                            <option value="">No expiry</option>
                                            <option value="7">7 days</option>
                                            <option value="14">14 days</option>
                                            {maxExpiryDays >= 30 && <option value="30">30 days</option>}
                                            {maxExpiryDays >= 90 && <option value="90">90 days</option>}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label className="form-label" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Description (shown on share page)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Short API description for prospects"
                                        value={sandboxDescription}
                                        onChange={e => setSandboxDescription(e.target.value)}
                                        maxLength={500}
                                        disabled={mutation.isPending}
                                        style={{ height: '32px', fontSize: '12px', opacity: mutation.isPending ? 0.6 : 1 }}
                                    />
                                </div>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text)' }}>
                                    <input
                                        type="checkbox"
                                        checked={sharePageEnabled}
                                        onChange={e => setSharePageEnabled(e.target.checked)}
                                        disabled={mutation.isPending}
                                        style={{ accentColor: 'var(--color-primary)' }}
                                    />
                                    Enable share page — Show branded landing page at sandbox URL
                                </label>
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
                                        color: 'var(--color-logo-line)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                    }}
                                >
                                    Upgrade to PRO to unlock sandbox features →
                                </button>
                            )}
                        </div>
                    )}

                </div>

                <div className="modal-actions">
                    <button onClick={() => {
                        onClose();
                        setSpecId('');
                        setSpecVersionId('');
                        setStateful(false);
                        setDelay('');
                        setErrorRate('');
                        setRequireAuth(false);
                        setStrictValidation(false);
                        setStrictLevel('hard');
                        setSandboxLabel('');
                        setSandboxDescription('');
                        setSharePageEnabled(false);
                        setExpiryPreset('');
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