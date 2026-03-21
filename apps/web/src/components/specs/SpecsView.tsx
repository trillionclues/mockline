'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { specsApi, type Spec } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { useTierGuard } from '@/hooks/useTierGuard'
import { SpecsEmptyState } from './SpecsEmptyState'
import { SpecsTable } from './SpecsTable'
import { UploadSpecModal } from './UploadSpecModal'
import { PenLine } from 'lucide-react'

export function SpecsView({ initialSpecs }: { initialSpecs: Spec[] }) {
    const [uploadOpen, setUploadOpen] = useState(false)
    const router = useRouter()
    const { guardAction } = useTierGuard()

    const { data: specs } = useQuery({
        queryKey: queryKeys.specs.all(),
        queryFn: specsApi.list,
        initialData: initialSpecs,
    })

    const handleDesignSpec = () => {
        if (guardAction('PRO')) {
            router.push('/specs/new')
        }
    }

    return (
        <div style={{
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
                    fontSize: '24px',
                    fontWeight: 600,
                    color: 'var(--color-text-strong)',
                }}>
                    Specs
                </h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleDesignSpec}
                        className="btn-secondary"
                        style={{
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <PenLine size={14} />
                        Design Spec
                    </button>
                    <button
                        onClick={() => setUploadOpen(true)}
                        style={{
                            height: '36px',
                            padding: '0 16px',
                            background: 'var(--color-logo-line)',
                            color: 'var(--color-bg)',
                            border: 'none',
                            borderRadius: '6px',
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
