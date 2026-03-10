'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { specsApi, type Spec } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { SpecsEmptyState } from './SpecsEmptyState'
import { SpecsTable } from './SpecsTable'
import { UploadSpecModal } from './UploadSpecModal'

export function SpecsView({ initialSpecs }: { initialSpecs: Spec[] }) {
    const [uploadOpen, setUploadOpen] = useState(false)

    const { data: specs } = useQuery({
        queryKey: queryKeys.specs.all(),
        queryFn: specsApi.list,
        initialData: initialSpecs,
    })

    return (
        <div style={{
            padding: '32px 48px',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            height: '100%',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '32px',
            }}>
                <h1 style={{
                    fontFamily: 'var(--font-family-heading)',
                    fontSize: '24px',
                    fontWeight: 600,
                    color: 'var(--color-text-strong)',
                }}>
                    Specs
                </h1>
                <button
                    onClick={() => setUploadOpen(true)}
                    style={{
                        height: '36px',
                        padding: '0 16px',
                        background: 'var(--color-primary)',
                        color: 'var(--color-bg)',
                        border: 'none',
                        borderRadius: '6px',
                        fontFamily: 'var(--font-family-sans)',
                        fontWeight: 500,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'opacity 120ms ease',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                    Upload Spec
                </button>
            </div>

            {specs.length === 0 ? (
                <SpecsEmptyState onUpload={() => setUploadOpen(true)} />
            ) : (
                <SpecsTable specs={specs} />
            )}

            <UploadSpecModal
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
            />
        </div>
    )
}
