import { Lock } from 'lucide-react'

type Props = {
    tier: 'PRO' | 'TEAM'
}

export function TierBadge({ tier }: Props) {
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '9px',
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: '3px',
            background: 'var(--color-logo-line)',
            color: 'var(--color-bg)',
            border: '1px solid var(--color-border-highlight)',
            letterSpacing: '0.04em',
            flexShrink: 0,
        }}>
            <Lock size={8} />
            {tier}
        </span>
    )
}
