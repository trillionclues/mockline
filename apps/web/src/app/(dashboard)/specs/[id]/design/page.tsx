import { specsApi } from '@/lib/api-client'
import { headers } from 'next/headers'
import { SpecDesignerView } from '@/components/spec-designer/SpecDesignerView'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'

export default async function DesignSpecPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) redirect('/login')
    if (session.user?.tier === 'FREE') redirect('/specs?upgrade=designer')

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

        // Parse the latest version's content back to builder state
        const latestVersion = versions[0] ?? null

        return (
            <SpecDesignerView
                mode="edit"
                existingSpec={spec}
                existingContent={latestVersion?.content ?? null}
                existingFormat={latestVersion?.format ?? 'YAML'}
            />
        )
    } catch {
        notFound()
    }
}
