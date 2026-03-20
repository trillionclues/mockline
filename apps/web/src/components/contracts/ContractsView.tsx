'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { contractsApi, type ContractTestRun, type Spec, type MockServer } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { ClipboardCheck } from 'lucide-react'
import { RunContractModal } from './RunContractModal'
import { ContractResultsTable } from './ContractResultsTable'
import { PageHeader } from '../shared/PageHeader'
import { EmptyState } from '../shared/EmptyState'
import { LockedFeatureState } from '../shared/LockedFeatureState'
import { useTierGuard } from '@/hooks/useTierGuard'
import { TierBadge } from '../shared/TierBadge'

type Props = {
    initialRuns: ContractTestRun[]
    specs: Spec[]
    mocks: MockServer[]
}

export function ContractsView({ initialRuns, specs, mocks }: Props) {
    const [runOpen, setRunOpen] = useState(false)
    const { canAccess, guardAction } = useTierGuard()
    const hasAccess = canAccess('PRO')

    const { data: runs } = useQuery({
        queryKey: queryKeys.contracts.all(),
        queryFn: () => contractsApi.list(),
        initialData: initialRuns,
        enabled: hasAccess,
    })

    return (
        <div>
            <PageHeader
                title="Contracts"
                description="Run contract tests to validate mock servers against OpenAPI specs."
                action={{
                    label: 'Run Tests',
                    onClick: () => {
                        if (!guardAction('PRO')) return
                        setRunOpen(true)
                    },
                    badge: !hasAccess ? <TierBadge tier="PRO" /> : undefined,
                }}
            />

            {!hasAccess ? (
                <LockedFeatureState
                    title="Contract testing is a PRO feature"
                    description="Validate your mock servers against their OpenAPI specifications automatically."
                    tier="PRO"
                />
            ) : runs.length === 0 ? (
                <EmptyState
                    icon={<ClipboardCheck size={24} />}
                    title="No contract tests run yet"
                    description="Select a spec and a running mock server to validate the API contract."
                    action={{ label: 'Run Tests', onClick: () => setRunOpen(true) }}
                />
            ) : (
                <ContractResultsTable runs={runs} />
            )}

            <RunContractModal
                open={runOpen}
                onClose={() => setRunOpen(false)}
                specs={specs}
                mocks={mocks}
            />
        </div>
    )
}