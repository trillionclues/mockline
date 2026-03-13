import { Sidebar } from '@/components/shell/Sidebar'
import { Topbar } from '@/components/shell/Topbar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            overflow: 'hidden',
            background: 'var(--color-bg)',
        }}>
            <Sidebar />
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minWidth: 0,
            }}>
                <Topbar />
                <main style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px',
                }}>
                    <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
