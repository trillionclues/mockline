import { SpecsView } from '@/components/specs/SpecsView'
import { specsApi } from '@/lib/api-client'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function SpecsPage() {
    const session = await getSession()
    if (!session) redirect('/login')

    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    const specs = await specsApi.list({ headers: apiHeaders })

    return <SpecsView initialSpecs={specs} />
}
