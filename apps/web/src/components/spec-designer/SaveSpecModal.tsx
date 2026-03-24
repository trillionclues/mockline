'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { specsApi } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { useRouter } from 'next/navigation'
import type { SpecDetail } from '@/lib/api-client'
import { clearDraft } from './SpecDesignerView'

type Props = {
    open: boolean
    onClose: () => void
    mode: 'new' | 'edit'
    existingSpec?: SpecDetail
    content: string
    format: 'YAML' | 'JSON'
}

export function SaveSpecModal({ open, onClose, mode, existingSpec, content, format }: Props) {
    const [specName, setSpecName] = useState(existingSpec?.name ?? '')
    const [deployAfter, setDeployAfter] = useState(true)
    const queryClient = useQueryClient()
    const router = useRouter()

    const createMutation = useMutation({
        mutationFn: () => specsApi.create({
            name: specName,
            content,
            format: format.toLowerCase() as 'yaml' | 'json',
        }),
        onSuccess: (spec) => {
            clearDraft()
            queryClient.invalidateQueries({ queryKey: queryKeys.specs.all() })
            onClose()
            if (deployAfter) {
                router.push(`/mocks?specId=${spec.id}&specVersionId=${spec.versions[0]?.id}`)
            } else {
                router.push(`/specs/${spec.id}`)
            }
        },
    })

    const versionMutation = useMutation({
        mutationFn: () => specsApi.uploadVersion(existingSpec!.id, {
            content,
            format: format.toLowerCase() as 'yaml' | 'json',
        }),
        onSuccess: (version) => {
            clearDraft(existingSpec!.id)
            queryClient.invalidateQueries({ queryKey: queryKeys.specs.versions(existingSpec!.id) })
            onClose()
            if (deployAfter) {
                router.push(`/mocks?specId=${existingSpec!.id}&specVersionId=${version.id}`)
            } else {
                router.push(`/specs/${existingSpec!.id}`)
            }
        },
    })

    if (!open) return null

    const isPending = createMutation.isPending || versionMutation.isPending

    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '440px' }}>
                <h2 className="modal-title">
                    {mode === 'new' ? 'Save Spec' : 'Save New Version'}
                </h2>

                {mode === 'new' && (
                    <div className="form-field">
                        <label className="form-label">Spec name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={specName}
                            onChange={e => setSpecName(e.target.value)}
                            placeholder="Petstore API"
                            autoFocus
                        />
                    </div>
                )}

                {mode === 'edit' && (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        This will add a new version to <strong>{existingSpec?.name}</strong>.
                    </p>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text)', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={deployAfter}
                        onChange={e => setDeployAfter(e.target.checked)}
                        style={{ accentColor: 'var(--color-primary)' }}
                    />
                    Deploy mock server immediately after saving
                </label>

                <div className="modal-actions">
                    <button onClick={onClose} disabled={isPending} className="btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={() => mode === 'new' ? createMutation.mutate() : versionMutation.mutate()}
                        disabled={isPending || (mode === 'new' && !specName.trim())}
                        className="btn-primary"
                    >
                        {isPending ? 'Saving...' : mode === 'new' ? 'Save Spec' : 'Save Version'}
                    </button>
                </div>
            </div>
        </div>
    )
}
