'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { specsApi } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

type Props = { open: boolean; onClose: () => void; specId: string }

export function UploadVersionModal({ open, onClose, specId }: Props) {
    const [content, setContent] = useState('')
    const [format, setFormat] = useState<'yaml' | 'json'>('yaml')
    const [error, setError] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: () => specsApi.uploadVersion(specId, { content, format }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.specs.versions(specId) })
            setContent('')
            setFormat('yaml')
            setError(null)
            onClose()
        },
        onError: (err: Error) => setError(err.message),
    })

    if (!open) return null

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2 className="modal-title">Upload New Version</h2>
                <p className="modal-subtitle">Paste updated OpenAPI spec content below.</p>

                {error && (
                    <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-destructive)', borderRadius: '6px', color: 'var(--color-destructive)', fontSize: '13px' }}>
                        {error}
                    </div>
                )}

                <div className="form-field">
                    <label className="form-label">Format</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(['yaml', 'json'] as const).map(f => (
                            <label key={f} style={{
                                display: 'inline-block', padding: '6px 16px',
                                background: format === f ? 'var(--color-surface-2)' : 'var(--color-bg)',
                                border: `1px solid ${format === f ? 'var(--color-text-subtle)' : 'var(--color-border)'}`,
                                borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                                cursor: 'pointer', color: format === f ? 'var(--color-text-strong)' : 'var(--color-text)',
                            }}>
                                <input type="radio" name="format" value={f} checked={format === f} onChange={() => setFormat(f)} style={{ display: 'none' }} />
                                {f.toUpperCase()}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-field">
                    <label className="form-label">Spec Content</label>
                    <textarea
                        className="form-textarea"
                        rows={10}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="Paste your OpenAPI spec here..."
                        style={{ resize: 'vertical', minHeight: '160px' }}
                    />
                </div>

                <div className="modal-actions">
                    <button onClick={onClose} disabled={mutation.isPending} className="btn-secondary">Cancel</button>
                    <button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending || !content.trim()}
                        className="btn-primary"
                        style={{
                            background: 'var(--color-logo-line)',
                            color: 'var(--color-bg)',
                        }}
                    >
                        {mutation.isPending ? 'Uploading...' : 'Upload Version'}
                    </button>
                </div>
            </div>
        </div>
    )
}