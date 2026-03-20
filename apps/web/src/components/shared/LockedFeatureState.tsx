import { Lock } from 'lucide-react'
import { useUpgradeModal } from '@/contexts/upgrade-modal'

type Props = {
    title: string
    description: string
    tier: 'PRO' | 'TEAM'
}

export function LockedFeatureState({ title, description, tier }: Props) {
    const { open } = useUpgradeModal()

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            background: 'var(--color-surface)',
            border: '1px dashed var(--color-border)',
            borderRadius: '8px',
            textAlign: 'center',
        }}>
            <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                background: 'var(--color-primary-muted)',
                border: '1px solid var(--color-border-highlight)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
            }}>
                <Lock size={20} color="var(--color-text-muted)" />
            </div>

            <h3 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--color-text-strong)',
                marginBottom: '8px',
            }}>
                {title}
            </h3>

            <p style={{
                fontSize: '13px',
                color: 'var(--color-text)',
                maxWidth: '320px',
                marginBottom: '20px',
                lineHeight: 1.5,
            }}>
                {description}
            </p>

            <button onClick={open} className="btn-primary" style={{ height: '36px', padding: '0 20px' }}>
                Upgrade to {tier}
            </button>
        </div>
    )
}
