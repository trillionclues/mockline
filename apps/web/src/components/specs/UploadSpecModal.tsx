import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { specsApi } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

type Props = {
    open: boolean
    onClose: () => void
}

export function UploadSpecModal({ open, onClose }: Props) {
    const [name, setName] = useState('')
    const [content, setContent] = useState('')
    const [format, setFormat] = useState<'yaml' | 'json'>('yaml')
    const [error, setError] = useState<string | null>(null)

    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async () => {
            return specsApi.create({ name, content, format })
        },
        onSuccess: () => {
            // Invalidate & refetch specs list
            queryClient.invalidateQueries({ queryKey: queryKeys.specs.all() })
            setName('')
            setContent('')
            setFormat('yaml')
            setError(null)
            onClose()
        },
        onError: (err: Error) => {
            setError(err.message)
        }
    })

    if (!open) return null

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 10, 11, 0.8)',
            backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '560px',
                padding: '32px',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
            }}>
                <h2 style={{
                    fontFamily: 'var(--font-family-heading)',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--color-text-strong)',
                    marginBottom: '8px',
                }}>
                    Upload Specification
                </h2>
                <p style={{
                    fontFamily: 'var(--font-family-sans)',
                    fontSize: '14px',
                    color: 'var(--color-text-muted)',
                    marginBottom: '24px',
                }}>
                    Upload your OpenAPI 3.0 specification in YAML or JSON format.
                </p>

                {error && (
                    <div style={{
                        padding: '12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--color-destructive)',
                        borderRadius: '6px',
                        color: 'var(--color-destructive)',
                        fontSize: '13px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'start',
                    }}>
                        <span style={{ fontWeight: 600, marginRight: '8px' }}>Error:</span>
                        <span style={{ flex: 1 }}>{error}</span>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={labelStyle}>Spec Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Stripe API"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Format</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <label style={radioContainerStyle(format === 'yaml')}>
                                <input
                                    type="radio"
                                    name="format"
                                    value="yaml"
                                    checked={format === 'yaml'}
                                    onChange={() => setFormat('yaml')}
                                    style={{ display: 'none' }}
                                />
                                YAML
                            </label>
                            <label style={radioContainerStyle(format === 'json')}>
                                <input
                                    type="radio"
                                    name="format"
                                    value="json"
                                    checked={format === 'json'}
                                    onChange={() => setFormat('json')}
                                    style={{ display: 'none' }}
                                />
                                JSON
                            </label>
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Spec Content</label>
                        <textarea
                            placeholder="Paste your OpenAPI spec here..."
                            rows={8}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            style={{
                                ...inputStyle,
                                fontFamily: 'var(--font-family-mono)',
                                resize: 'vertical',
                                minHeight: '120px',
                            }}
                        />
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    marginTop: '32px',
                }}>
                    <button
                        onClick={onClose}
                        disabled={mutation.isPending}
                        style={{
                            height: '36px',
                            padding: '0 16px',
                            background: 'transparent',
                            color: 'var(--color-text)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'background 120ms ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending || !name.trim() || !content.trim()}
                        style={{
                            height: '36px',
                            padding: '0 16px',
                            background: 'var(--color-primary)',
                            color: 'var(--color-bg)',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 500,
                            cursor: mutation.isPending || !name.trim() || !content.trim() ? 'not-allowed' : 'pointer',
                            opacity: mutation.isPending || !name.trim() || !content.trim() ? 0.5 : 1,
                            transition: 'opacity 120ms ease',
                        }}
                    >
                        {mutation.isPending ? 'Uploading...' : 'Upload Spec'}
                    </button>
                </div>
            </div>
        </div>
    )
}

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-family-sans)',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-text)',
    marginBottom: '8px',
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    color: 'var(--color-text-strong)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 120ms ease',
}

const radioContainerStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-block',
    padding: '6px 16px',
    background: active ? 'var(--color-surface-2)' : 'var(--color-bg)',
    border: `1px solid ${active ? 'var(--color-text-subtle)' : 'var(--color-border)'}`,
    borderRadius: '6px',
    color: active ? 'var(--color-text-strong)' : 'var(--color-text)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 120ms ease',
})
