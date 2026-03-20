import { DashboardShell } from '@/components/shell/DashboardShell'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { User } from '@/types'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getSession()
    if (!session) redirect('/login')

    return (
        <DashboardShell user={session.user as User}>
            {children}
        </DashboardShell>
    )
}