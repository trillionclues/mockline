'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { specsApi, type SpecDetail, type SpecVersion } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { ArrowLeft } from 'lucide-react'
import { VersionHistoryTable } from './VersionHistoryTable'
import { UploadVersionModal } from './UploadVersionModal'
import { DateDisplay } from '../shared/DateDisplay'

type Props = {
    spec: SpecDetail
    initialVersions: SpecVersion[]
}

export function SpecDetailView({ spec, initialVersions }: Props) {
    const router = useRouter()
    const [versionModalOpen, setVersionModalOpen] = useState(false)

    const { data: versions } = useQuery({
        queryKey: queryKeys.specs.versions(spec.id),
        queryFn: () => specsApi.getVersions(spec.id),
        initialData: initialVersions,
    })

    return (
        <div>
            <button
                onClick={() => router.push('/specs')}
                className="btn-secondary"
                style={{ height: '28px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
                <ArrowLeft size={12} />
                Specs
            </button>

            <div className="page-header">
                <div>
                    <h1 className="page-title">{spec.name}</h1>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        <span>{spec.format}</span>
                        <span>·</span>
                        <span>{versions.length} version{versions.length !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>{spec._count?.mockServers ?? 0} mock{(spec._count?.mockServers ?? 0) !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>Added <DateDisplay date={spec.createdAt} /></span>
                    </div>
                </div>
                <button onClick={() => setVersionModalOpen(true)} className="btn-primary" style={{
                    background: 'var(--color-logo-line)',
                    color: 'var(--color-bg)',
                }}>
                    New Version
                </button>
            </div>

            <VersionHistoryTable specId={spec.id} versions={versions} />

            <UploadVersionModal
                open={versionModalOpen}
                onClose={() => setVersionModalOpen(false)}
                specId={spec.id}
            />
        </div>
    )
}