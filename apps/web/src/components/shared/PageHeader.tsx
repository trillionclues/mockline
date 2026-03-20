type Props = {
    title: string
    description?: string
    action?: { label: string; onClick: () => void; badge?: React.ReactNode }
}

export function PageHeader({ title, description, action }: Props) {
    return (
        <div className="page-header">
            <div className="page-header-top">
                <h1 className="page-title">{title}</h1>
                {action && (
                    <button onClick={action.onClick} className="btn-primary page-header-btn"
                        style={{ background: 'var(--color-logo-line)', color: 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {action.label}
                        {action.badge}
                    </button>
                )}
            </div>
            {description && <p className="page-description">{description}</p>}
        </div>
    )
}