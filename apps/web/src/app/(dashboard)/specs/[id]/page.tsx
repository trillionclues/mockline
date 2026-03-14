import { SpecDetailView } from '@/components/specs/SpecDetailView'
import { specsApi } from '@/lib/api-client'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

export default async function SpecDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    try {
        const [spec, versions] = await Promise.all([
            specsApi.get(id, { headers: apiHeaders }),
            specsApi.getVersions(id, { headers: apiHeaders }),
        ])
        return <SpecDetailView spec={spec} initialVersions={versions} />
    } catch {
        notFound()
    }
}