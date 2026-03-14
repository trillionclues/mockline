type Props = {
    icon: React.ReactNode
    title: string
    description: string
    action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: Props) {
    return (
        <div className="empty-state">
            <div style={{ color: 'var(--color-text-subtle)', marginBottom: '12px' }}>{icon}</div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-desc">{description}</p>
            {action && (
                <button onClick={action.onClick} className="btn-secondary">
                    {action.label}
                </button>
            )}
        </div>
    )
}