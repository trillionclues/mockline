import { SettingsView } from '@/components/settings/SettingsView'
import { getSession } from '@/lib/auth'

export default async function SettingsPage() {
    const session = await getSession()
    return <SettingsView user={session?.user} />
}