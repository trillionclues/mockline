'use client'
import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { specsApi, mocksApi, type Spec } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

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

    useEffect(() => {
        if (prefilledSpecId) setSpecId(prefilledSpecId)
        if (prefilledSpecVersionId) setSpecVersionId(prefilledSpecVersionId)
    }, [prefilledSpecId, prefilledSpecVersionId])

    // Reset version when spec changes
    useEffect(() => {
        if (!prefilledSpecVersionId) setSpecVersionId('')
    }, [specId])

    const { data: versions } = useQuery({
        queryKey: queryKeys.specs.versions(specId),
        queryFn: () => specsApi.getVersions(specId),
        enabled: !!specId,
    })

    const mutation = useMutation({
        mutationFn: () => mocksApi.provision({ specId, specVersionId, stateful: false }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.mocks.all() })
            setSpecId('')
            setSpecVersionId('')
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
                </div>

                <div className="modal-actions">
                    <button onClick={onClose} disabled={mutation.isPending} className="btn-secondary">Cancel</button>
                    <button onClick={() => mutation.mutate()} disabled={!canSubmit} className="btn-primary" style={{ background: 'var(--color-logo-line)', color: 'var(--color-bg)' }}>
                        {mutation.isPending ? 'Deploying...' : 'Deploy Mock'}
                    </button>
                </div>
            </div>
        </div>
    )
}