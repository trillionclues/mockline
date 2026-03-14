'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { mocksApi, specsApi, type MockServer } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { Endpoint } from '@/types'
import { EndpointList } from './EndpointList'
import { RequestPanel } from './RequestPanel'
import { ResponsePanel } from './ResponsePanel'

export type ExplorerResponse = {
    status?: number
    statusText?: string
    headers?: Record<string, string>
    body?: unknown
    error?: string
    duration: number
}

export function ExplorerView({ initialMocks }: { initialMocks: MockServer[] }) {
    const [selectedMockId, setSelectedMockId] = useState<string | null>(null)
    const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null)
    const [response, setResponse] = useState<ExplorerResponse | null>(null)

    const { data: mocks } = useQuery({
        queryKey: queryKeys.mocks.all(),
        queryFn: mocksApi.list,
        initialData: initialMocks,
    })

    const runningMocks = mocks.filter(m => m.status === 'RUNNING')
    const selectedMock = runningMocks.find(m => m.id === selectedMockId)

    // SpecDetail has an `endpoints` field already parsed by the API.
    // No frontend parsing needed.
    const { data: specDetail } = useQuery({
        queryKey: queryKeys.specs.detail(selectedMock?.specId ?? ''),
        queryFn: () => specsApi.get(selectedMock!.specId),
        enabled: !!selectedMock,
    })

    const endpoints = specDetail?.endpoints ?? []

    return (
        <div>
            <h1 className="page-title">API Explorer</h1>
            <p className="page-description" style={{ marginBottom: '20px' }}>
                Fire real requests against your live mock servers.
            </p>

            <div style={{ marginBottom: '20px' }}>
                <select
                    value={selectedMockId ?? ''}
                    onChange={e => { setSelectedMockId(e.target.value); setSelectedEndpoint(null); setResponse(null) }}
                    className="form-select"
                    style={{ maxWidth: '320px' }}
                >
                    <option value="">Select a running mock...</option>
                    {runningMocks.map(m => (
                        <option key={m.id} value={m.id}>
                            {m.spec.name} v{m.specVersion.version}
                        </option>
                    ))}
                </select>
                {runningMocks.length === 0 && (
                    <p className="form-hint">No running mock servers. Start one from the Mocks page.</p>
                )}
            </div>

            {selectedMock && (
                <div className="explorer-layout">
                    <EndpointList
                        endpoints={endpoints}
                        selected={selectedEndpoint}
                        onSelect={(ep) => { setSelectedEndpoint(ep); setResponse(null) }}
                    />
                    <div className="explorer-right">
                        {selectedEndpoint ? (
                            <>
                                <RequestPanel
                                    endpoint={selectedEndpoint}
                                    baseUrl={selectedMock.publicUrl ?? ''}
                                    onResponse={setResponse}
                                />
                                {response && <ResponsePanel response={response} />}
                            </>
                        ) : (
                            <div className="explorer-placeholder">
                                Select an endpoint from the list
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}