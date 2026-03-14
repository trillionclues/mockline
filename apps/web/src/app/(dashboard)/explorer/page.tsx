import { ExplorerView } from '@/components/explorer/ExplorerView'
import { mocksApi } from '@/lib/api-client'
import { headers } from 'next/headers'

export default async function ExplorerPage() {
    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    const mocks = await mocksApi.list({ headers: apiHeaders })

    return <ExplorerView initialMocks={mocks} />
}