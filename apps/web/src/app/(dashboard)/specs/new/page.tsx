import { SpecDesignerView } from '@/components/spec-designer/SpecDesignerView'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function NewSpecPage() {
    const session = await getSession()
    if (!session) redirect('/login')
    if (session.user.tier === 'FREE') redirect('/specs?upgrade=designer')

    return <SpecDesignerView mode="new" />
}
