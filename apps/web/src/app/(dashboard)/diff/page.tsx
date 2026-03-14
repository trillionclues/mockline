import { DiffView } from '@/components/diff/DiffView';
import { specsApi } from '@/lib/api-client'
import { headers } from 'next/headers'

export default async function DiffPage({
    searchParams,
}: {
    searchParams: Promise<{ specId?: string; v1?: string; v2?: string }>
}) {
    const { specId, v1, v2 } = await searchParams
    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    const specs = await specsApi.list({ headers: apiHeaders })

    return (
        <DiffView
            specs={specs}
            prefilledSpecId={specId}
            prefilledV1={v1 ? parseInt(v1) : undefined}
            prefilledV2={v2 ? parseInt(v2) : undefined}
        />
    )
}