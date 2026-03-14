'use client'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { specsApi, type Spec } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { DateDisplay } from '../shared/DateDisplay'

export function SpecsTable({ specs }: { specs: Spec[] }) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [deleteTarget, setDeleteTarget] = useState<Spec | null>(null)

    const deleteMutation = useMutation({
        mutationFn: (id: string) => specsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.specs.all() })
            setDeleteTarget(null)
        },
    })

    return (
        <>
            <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                overflowX: 'auto',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Format</th>
                            <th style={thStyle}>Versions</th>
                            <th style={thStyle}>Mocks</th>
                            <th style={thStyle}>Added</th>
                            <th style={{ ...thStyle, width: '40px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {specs.map(spec => (
                            <tr
                                key={spec.id}
                                onClick={() => router.push(`/specs/${spec.id}`)}
                                style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 120ms ease' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: 500, color: 'var(--color-text-strong)' }}>
                                        {spec.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                        {spec.id.substring(0, 8)}
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '1px 6px',
                                        background: 'var(--color-surface-2)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontFamily: 'var(--font-family-mono)',
                                        color: 'var(--color-text-muted)',
                                    }}>
                                        {spec.versions?.[0]?.format}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>
                                        {spec.versions?.length ?? 0}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>
                                        {spec._count?.mockServers ?? 0}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>
                                        <DateDisplay date={spec.createdAt} />
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                    <button
                                        className="btn-icon destructive"
                                        onClick={e => {
                                            e.stopPropagation()
                                            setDeleteTarget(spec)
                                        }}
                                        title="Delete spec"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title={`Delete "${deleteTarget?.name}"`}
                description="This will permanently delete the spec, all its versions, and any associated mock servers."
                confirmWord="DELETE"
                variant="destructive"
                onConfirm={() => deleteMutation.mutateAsync(deleteTarget!.id)}
            />
        </>
    )
}


const thStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--color-text-subtle)',
    padding: '10px 16px',
}

const tdStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--color-text)',
    padding: '14px 16px',
}

