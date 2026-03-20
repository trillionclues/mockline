'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { billingApi } from '@/lib/api-client'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { CopyButton } from '../shared/CopyButton'
import type { User } from '@/types'

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
                    <h2 className="section-title">API Access (Coming Soon)</h2>
                    <p style={{ fontSize: '13px', color: 'var(--color-text)', marginBottom: '16px' }}>
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
                        color: 'var(--color-text)',
                    }}>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            sk_live_••••••••••••••••••••••••
                        </span>
                        <CopyButton value="coming-soon" />
                    </div>
                    {/* <p className="form-hint" style={{ marginTop: '8px' }}>API key management coming soon.</p> */}
                </section>
            </div>

            {user?.subscriptionStatus && user.tier !== 'FREE' && (
                <section className="settings-section settings-card" style={{ marginTop: '24px' }}>
                    <h2 className="section-title">Subscription</h2>

                    {user.subscriptionStatus === 'past_due' && (
                        <div style={{
                            padding: '10px 12px',
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#ef4444',
                            marginBottom: '16px',
                        }}>
                            Your last payment failed. Please update your payment method to avoid losing access.
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className="settings-name">{user.tier} Plan</div>
                            <div className="settings-email">
                                {user.subscriptionStatus === 'cancelled'
                                    ? `Cancels ${user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt).toLocaleDateString() : 'at end of period'}`
                                    : user.subscriptionStatus === 'active' || user.subscriptionStatus === 'past_due'
                                        ? `Renews ${user.subscriptionRenewsAt ? new Date(user.subscriptionRenewsAt).toLocaleDateString() : 'soon'}`
                                        : `Ends ${user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt).toLocaleDateString() : 'soon'}`}
                            </div>
                        </div>
                        {user.subscriptionStatus === 'active' && (
                            <button
                                className="btn-secondary"
                                style={{ height: '32px', fontSize: '12px' }}
                                onClick={async () => {
                                    if (!confirm('Are you sure you want to cancel your Mockline subscription? You will still have access until the end of the billing period.')) return
                                    try {
                                        await billingApi.cancel()
                                        alert('Subscription cancelled. You will still have access until the end of the billing period.')
                                        window.location.reload()
                                    } catch (err: any) {
                                        alert('Failed to cancel subscription: ' + err.message)
                                    }
                                }}
                            >
                                Cancel plan
                            </button>
                        )}
                    </div>
                </section>
            )}

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
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/me`, {
                        method: 'DELETE',
                        credentials: 'include',
                    })
                    if (!res.ok) {
                        const body = await res.json().catch(() => null)
                        throw new Error(body?.error?.message ?? 'Failed to delete account')
                    }
                    await authClient.signOut()
                    router.push('/')
                }}
            />
        </div>
    )
}