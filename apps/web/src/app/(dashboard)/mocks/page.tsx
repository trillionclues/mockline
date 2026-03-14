import { mocksApi, specsApi } from '@/lib/api-client'
import { headers } from 'next/headers'
import { MocksView } from '@/components/mocks/MocksView'

export default async function MocksPage({
    searchParams,
}: {
    searchParams: Promise<{ specId?: string; specVersionId?: string }>
}) {
    const searchParam = await searchParams;

    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    const [mocks, specs] = await Promise.all([
        mocksApi.list({ headers: apiHeaders }),
        specsApi.list({ headers: apiHeaders }),
    ])

    return (
        <MocksView
            initialMocks={mocks}
            specs={specs}
            // Pre-fill provision modal when navigated from spec detail "Deploy mock"
            prefilledSpecId={searchParam.specId}
            prefilledSpecVersionId={searchParam.specVersionId}
        />
    )
}