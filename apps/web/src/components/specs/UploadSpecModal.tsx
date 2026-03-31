import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { specsApi } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { useUpgradeModal } from '@/contexts/upgrade-modal'

type Props = {
    open: boolean
    onClose: () => void
}

type SourceMode = 'paste' | 'url'

export function UploadSpecModal({ open, onClose }: Props) {
    const [name, setName] = useState('')
    const [content, setContent] = useState('')
    const [specUrl, setSpecUrl] = useState('')
    const [format, setFormat] = useState<'yaml' | 'json'>('yaml')
    const [source, setSource] = useState<SourceMode>('paste')
    const [error, setError] = useState<string | null>(null)
    const { open: openUpgrade } = useUpgradeModal()

    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async () => {
            if (source === 'url') {
                return specsApi.create({ name, url: specUrl })
            }
            return specsApi.create({ name, content, format })
        },
        onSuccess: () => {
            // Invalidate & refetch specs list
            queryClient.invalidateQueries({ queryKey: queryKeys.specs.all() })
            setName('')
            setContent('')
            setSpecUrl('')
            setFormat('yaml')
            setSource('paste')
            setError(null)
            onClose()
        },
        onError: (err: Error) => {
            if (err.message.includes('UPGRADE_REQUIRED') || err.message.includes('limit reached') || err.message.includes('Spec limit')) {
                openUpgrade()
                onClose()
                return
            }
            setError(err.message)
        }
    })

    const canSubmit = name.trim() && (
        source === 'paste' ? content.trim() : specUrl.trim()
    )

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
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--color-text-strong)',
                    marginBottom: '8px',
                }}>
                    Upload Specification
                </h2>
                <p style={{
                    fontSize: '14px',
                    color: 'var(--color-text-muted)',
                    marginBottom: '24px',
                }}>
                    Paste your OpenAPI spec or import from a remote URL.<br />
                    Try it: https://petstore.swagger.io/v2/swagger.json
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
                            disabled={mutation.isPending}
                            style={{
                                ...inputStyle,
                                opacity: mutation.isPending ? 0.6 : 1,
                            }}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Source</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <label style={radioContainerStyle(source === 'paste')}>
                                <input
                                    type="radio"
                                    name="source"
                                    value="paste"
                                    checked={source === 'paste'}
                                    onChange={() => { setSource('paste'); setError(null) }}
                                    disabled={mutation.isPending}
                                    style={{ display: 'none' }}
                                />
                                Paste Content
                            </label>
                            <label style={radioContainerStyle(source === 'url')}>
                                <input
                                    type="radio"
                                    name="source"
                                    value="url"
                                    checked={source === 'url'}
                                    onChange={() => { setSource('url'); setError(null) }}
                                    disabled={mutation.isPending}
                                    style={{ display: 'none' }}
                                />
                                Import URL
                            </label>
                        </div>
                    </div>

                    {source === 'paste' && (
                        <>
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
                                            disabled={mutation.isPending}
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
                                            disabled={mutation.isPending}
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
                                    disabled={mutation.isPending}
                                    style={{
                                        ...inputStyle,
                                        resize: 'vertical',
                                        minHeight: '120px',
                                        opacity: mutation.isPending ? 0.6 : 1,
                                    }}
                                />
                            </div>
                        </>
                    )}

                    {source === 'url' && (
                        <div>
                            <label style={labelStyle}>Spec URL</label>
                            <input
                                type="url"
                                placeholder="Example: https://petstore.swagger.io/v2/swagger.json"
                                value={specUrl}
                                onChange={(e) => setSpecUrl(e.target.value)}
                                disabled={mutation.isPending}
                                style={{
                                    ...inputStyle,
                                    opacity: mutation.isPending ? 0.6 : 1,
                                }}
                            />
                            <p style={{
                                fontSize: '12px',
                                color: 'var(--color-text-subtle)',
                                marginTop: '6px',
                            }}>
                                Note: URL to a .yaml or .json OpenAPI spec. Format is auto-detected.
                            </p>
                        </div>
                    )}
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    marginTop: '32px',
                }}>
                    <button
                        onClick={() => {
                            setName('')
                            setContent('')
                            setSpecUrl('')
                            setFormat('yaml')
                            setSource('paste')
                            setError(null)
                            onClose()
                        }}
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
                        disabled={mutation.isPending || !canSubmit}
                        style={{
                            height: '36px',
                            padding: '0 16px',
                            background: 'var(--color-logo-line)',
                            color: 'var(--color-bg)',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 500,
                            cursor: mutation.isPending || !canSubmit ? 'not-allowed' : 'pointer',
                            opacity: mutation.isPending || !canSubmit ? 0.5 : 1,
                            transition: 'opacity 120ms ease',
                        }}
                    >
                        {mutation.isPending
                            ? (source === 'url' ? 'Importing...' : 'Uploading...')
                            : (source === 'url' ? 'Import Spec' : 'Upload Spec')}
                    </button>
                </div>
            </div>
        </div>
    )
}

const labelStyle: React.CSSProperties = {
    display: 'block',
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
