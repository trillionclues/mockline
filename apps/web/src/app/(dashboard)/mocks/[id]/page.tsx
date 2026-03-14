import { MockDetailView } from '@/components/mocks/MockDetailView'
import { mocksApi } from '@/lib/api-client'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

export default async function MockDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    try {
        const { id } = await params
        const mock = await mocksApi.get(id, { headers: apiHeaders })
        return <MockDetailView initialMock={mock} />
    } catch {
        notFound()
    }
}