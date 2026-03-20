'use client'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { specsApi, type Spec } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { DiffViewer } from './DiffViewer'
import { useTierGuard } from '@/hooks/useTierGuard'
import { LockedFeatureState } from '../shared/LockedFeatureState'

type Props = {
    specs: Spec[]
    prefilledSpecId?: string
    prefilledV1?: number
    prefilledV2?: number
}

export function DiffView({ specs, prefilledSpecId, prefilledV1, prefilledV2 }: Props) {
    const { canAccess } = useTierGuard()
    const hasAccess = canAccess('PRO')

    const [specId, setSpecId] = useState(prefilledSpecId ?? '')
    const [v1, setV1] = useState<number | null>(prefilledV1 ?? null)
    const [v2, setV2] = useState<number | null>(prefilledV2 ?? null)
    const [hasDiffed, setHasDiffed] = useState(false)

    const { data: versions } = useQuery({
        queryKey: queryKeys.specs.versions(specId),
        queryFn: () => specsApi.getVersions(specId),
        enabled: !!specId && hasAccess,
    })

    const { data: diff, isFetching, refetch } = useQuery({
        queryKey: queryKeys.specs.diff(specId, v1 ?? 0, v2 ?? 0),
        queryFn: () => specsApi.diff(specId, v1!, v2!),
        enabled: false,
    })

    // Auto-run diff when navigated from spec detail with pre-filled values
    useEffect(() => {
        if (hasAccess && prefilledSpecId && prefilledV1 && prefilledV2) {
            refetch()
            setHasDiffed(true)
        }
    }, [])

    if (!hasAccess) {
        return (
            <div>
                <h1 className="page-title">Schema Diff</h1>
                <p className="page-description" style={{ marginBottom: '24px' }}>
                    Compare two versions of the same spec to identify breaking changes.
                </p>
                <LockedFeatureState
                    title="Schema diff is a PRO feature"
                    description="Compare two versions of the same spec to identify breaking changes before they hit production."
                    tier="PRO"
                />
            </div>
        )
    }

    const canCompare = !!specId && v1 !== null && v2 !== null && v1 !== v2

    const handleCompare = () => {
        refetch()
        setHasDiffed(true)
    }

    return (
        <div>
            <h1 className="page-title">Schema Diff</h1>
            <p className="page-description" style={{ marginBottom: '24px' }}>
                Compare two versions of the same spec to identify breaking changes.
            </p>

            <div className="diff-controls">
                <select
                    value={specId}
                    onChange={e => { setSpecId(e.target.value); setV1(null); setV2(null); setHasDiffed(false) }}
                    className="form-select"
                    style={{ maxWidth: '240px' }}
                >
                    <option value="">Select a spec...</option>
                    {specs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                {versions && versions.length >= 2 && (
                    <>
                        <select
                            value={v1 ?? ''}
                            onChange={e => setV1(Number(e.target.value))}
                            className="form-select"
                            style={{ maxWidth: '160px' }}
                        >
                            <option value="">Base version</option>
                            {versions.map(v => (
                                <option key={v.id} value={v.version} disabled={v.version === v2}>
                                    v{v.version}
                                </option>
                            ))}
                        </select>

                        <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>→</span>

                        <select
                            value={v2 ?? ''}
                            onChange={e => setV2(Number(e.target.value))}
                            className="form-select"
                            style={{ maxWidth: '160px' }}
                        >
                            <option value="">Compare version</option>
                            {versions.map(v => (
                                <option key={v.id} value={v.version} disabled={v.version === v1}>
                                    v{v.version}
                                </option>
                            ))}
                        </select>
                    </>
                )}

                {versions && versions.length < 2 && specId && (
                    <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        This spec needs at least 2 versions to diff.
                    </span>
                )}

                <button
                    onClick={handleCompare}
                    disabled={!canCompare || isFetching}
                    className="btn-primary"
                    style={{
                        background: 'var(--color-logo-line)',
                        color: 'var(--color-bg)',
                    }}
                >
                    {isFetching ? 'Comparing...' : 'Compare'}
                </button>
            </div>

            {hasDiffed && diff && <DiffViewer diff={diff} />}
        </div>
    )
}