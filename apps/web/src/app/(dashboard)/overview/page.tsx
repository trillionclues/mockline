import { specsApi, mocksApi } from '@/lib/api-client'
import { headers } from 'next/headers'
import { OverviewView } from '@/components/overview/OverviewView'

export default async function OverviewPage() {
    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    const [specs, mocks] = await Promise.all([
        specsApi.list({ headers: apiHeaders }),
        mocksApi.list({ headers: apiHeaders }),
    ])

    return <OverviewView specs={specs} mocks={mocks} />
}