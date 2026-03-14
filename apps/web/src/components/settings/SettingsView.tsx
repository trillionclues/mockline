'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { CopyButton } from '../shared/CopyButton'

type User = { name?: string | null; email?: string | null; image?: string | null, tier?: 'FREE' | 'PRO' | 'TEAM' | null }

export function SettingsView({ user }: { user?: User }) {
    const [deleteOpen, setDeleteOpen] = useState(false)
    const router = useRouter()

    return (
        <div style={{ width: '100%' }}>
            <h1 className="page-title" style={{ marginBottom: '24px' }}>Settings</h1>
            <div className="settings-top-row">
                <section className="settings-section settings-card">
                    <h2 className="section-title">Profile</h2>
                    <div className="settings-profile">
                        {user?.image ? (
                            <img src={user.image} alt={user.name ?? ''} className="settings-avatar" />
                        ) : (
                            <div className="settings-avatar settings-avatar-fallback">
                                {(user?.name ?? user?.email ?? 'U')[0].toUpperCase()}
                            </div>
                        )}
                        <div>
                            <div className="settings-name">{user?.name ?? 'User'}</div>
                            <div className="settings-email">{user?.email}</div>
                            <div className="settings-oauth-note">Managed via GitHub OAuth</div>
                        </div>
                    </div>
                </section>

                <section className="settings-section settings-card">
                    <h2 className="section-title">API Access</h2>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                        Authenticate direct requests to the Mockline API.
                    </p>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '13px',
                        color: 'var(--color-text-muted)',
                    }}>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            sk_live_••••••••••••••••••••••••
                        </span>
                        <CopyButton value="coming-soon" />
                    </div>
                    <p className="form-hint" style={{ marginTop: '8px' }}>API key management coming soon.</p>
                </section>
            </div>

            <section className="settings-section settings-card settings-danger">
                <h2 className="section-title" style={{ color: 'var(--color-destructive)' }}>
                    Danger Zone
                </h2>
                <p className="settings-danger-desc">
                    Permanently delete your account and all associated data — specs, mock servers, and contract runs.
                    This action CANNOT be undone!
                </p>
                <button className="btn-destructive" onClick={() => setDeleteOpen(true)}>
                    Delete Account
                </button>
            </section>

            <ConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                title="Delete your account"
                description="This will permanently delete your account and all your data. Type DELETE to confirm."
                confirmWord="DELETE"
                variant="destructive"
                onConfirm={async () => {
                    await authClient.deleteUser()
                    router.push('/')
                }}
            />
        </div>
    )
}