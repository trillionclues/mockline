import { SettingsView } from '@/components/settings/SettingsView'
import { getSession } from '@/lib/auth'
import type { User } from '@/types'

export default async function SettingsPage() {
    const session = await getSession()
    return <SettingsView user={session?.user as User | undefined} />
}