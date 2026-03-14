'use client'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { mocksApi, type MockServer, type Spec } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { ProvisionMockModal } from './ProvisionMockModal'
import { MocksTable } from './MocksTable'
import { MocksEmptyState } from './MocksEmptyState'
import { PageHeader } from '../shared/PageHeader'

type Props = {
    initialMocks: MockServer[]
    specs: Spec[]
    prefilledSpecId?: string
    prefilledSpecVersionId?: string
}

export function MocksView({ initialMocks, specs, prefilledSpecId, prefilledSpecVersionId }: Props) {
    const [provisionOpen, setProvisionOpen] = useState(false)

    // Auto-open provision modal if navigated from spec detail
    useEffect(() => {
        if (prefilledSpecId && prefilledSpecVersionId) setProvisionOpen(true)
    }, [prefilledSpecId, prefilledSpecVersionId])

    const { data: mocks } = useQuery({
        queryKey: queryKeys.mocks.all(),
        queryFn: mocksApi.list,
        initialData: initialMocks,
        refetchInterval: (query) => {
            const data = query.state.data ?? []
            const hasTransient = data.some(m => m.status === 'BUILDING')
            return hasTransient ? 2000 : false
        },
    })

    return (
        <div>
            <PageHeader
                title="Mock Servers"
                action={{ label: 'New Mock', onClick: () => setProvisionOpen(true) }}
            />

            {mocks.length === 0 ? (
                <MocksEmptyState onProvision={() => setProvisionOpen(true)} />
            ) : (
                <MocksTable mocks={mocks} />
            )}

            <ProvisionMockModal
                open={provisionOpen}
                onClose={() => setProvisionOpen(false)}
                specs={specs}
                prefilledSpecId={prefilledSpecId}
                prefilledSpecVersionId={prefilledSpecVersionId}
            />
        </div>
    )
}