'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contractsApi, type Spec, type MockServer } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

type Props = {
    open: boolean
    onClose: () => void
    specs: Spec[]
    mocks: MockServer[]
}

export function RunContractModal({ open, onClose, specs, mocks }: Props) {
    const [specId, setSpecId] = useState('')
    const [mockId, setMockId] = useState('')
    const [error, setError] = useState<string | null>(null)
    const queryClient = useQueryClient()

    // Only running mocks for the selected spec
    const eligibleMocks = mocks.filter(
        m => m.specId === specId && m.status === 'RUNNING'
    )
    const selectedMock = eligibleMocks.find(m => m.id === mockId)

    const mutation = useMutation({
        mutationFn: () => contractsApi.run({
            specId,
            baseUrl: selectedMock!.publicUrl!,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all() })
            setSpecId('')
            setMockId('')
            setError(null)
            onClose()
        },
        onError: (err: Error) => setError(err.message),
    })

    if (!open) return null

    const canSubmit = !!specId && !!mockId && !!selectedMock?.publicUrl && !mutation.isPending

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2 className="modal-title">Run Contract Tests</h2>
                <p className="modal-subtitle">Validate a running mock server against its OpenAPI specification.</p>

                {error && (
                    <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-destructive)', borderRadius: '6px', color: 'var(--color-destructive)', fontSize: '13px' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-field">
                        <label className="form-label">Specification</label>
                        <select
                            value={specId}
                            onChange={e => { setSpecId(e.target.value); setMockId('') }}
                            disabled={mutation.isPending}
                            className="form-select"
                            style={{ opacity: mutation.isPending ? 0.6 : 1 }}
                        >
                            <option value="">Select a spec...</option>
                            {specs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="form-field">
                        <label className="form-label">Mock Server</label>
                        <select
                            value={mockId}
                            onChange={e => setMockId(e.target.value)}
                            disabled={!specId || eligibleMocks.length === 0 || mutation.isPending}
                            className="form-select"
                            style={{ opacity: mutation.isPending ? 0.6 : 1 }}
                        >
                            <option value="">
                                {!specId
                                    ? 'Select a spec first'
                                    : eligibleMocks.length === 0
                                        ? 'No running mocks for this spec'
                                        : 'Select a running mock...'}
                            </option>
                            {eligibleMocks.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m?.spec?.name} v{m?.specVersion?.version} — {m.publicUrl}
                                </option>
                            ))}
                        </select>
                        {specId && eligibleMocks.length === 0 && (
                            <p className="form-hint">Start a mock server for this spec first.</p>
                        )}
                    </div>
                </div>

                <div className="modal-actions">
                    <button onClick={() => { setSpecId(''); setMockId(''); setError(null); onClose() }} disabled={mutation.isPending} className="btn-secondary">Cancel</button>
                    <button onClick={() => mutation.mutate()} disabled={!canSubmit} className="btn-primary" style={{
                        background: 'var(--color-logo-line)',
                        color: 'var(--color-bg)',
                    }}>
                        {mutation.isPending ? 'Running...' : 'Run Tests'}
                    </button>
                </div>
            </div>
        </div>
    )
}