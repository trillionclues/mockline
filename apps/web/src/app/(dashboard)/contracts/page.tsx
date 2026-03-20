import { ContractsView } from '@/components/contracts/ContractsView'
import { contractsApi, specsApi, mocksApi } from '@/lib/api-client'
import { headers } from 'next/headers'

export default async function ContractsPage() {
    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    const [runs, specs, mocks] = await Promise.all([
        contractsApi.list(undefined, { headers: apiHeaders }).catch(err => {
            // If the user isn't PRO, they get a 403 UPGRADE_REQUIRED.
            // Catch it so we don't crash the server render; the UI will show the LockedFeatureState.
            if (err?.code === 'UPGRADE_REQUIRED' || err?.statusCode === 403) return []
            throw err
        }),
        specsApi.list({ headers: apiHeaders }),
        mocksApi.list({ headers: apiHeaders }),
    ])

    return <ContractsView initialRuns={runs} specs={specs} mocks={mocks} />
}