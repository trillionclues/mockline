type Props = {
    title: string
    description?: string
    action?: { label: string; onClick: () => void }
}

export function PageHeader({ title, description, action }: Props) {
    return (
        <div className="page-header">
            <div className="page-header-top">
                <h1 className="page-title">{title}</h1>
                {action && (
                    <button onClick={action.onClick} className="btn-primary page-header-btn" style={{ background: 'var(--color-logo-line)', color: 'var(--color-bg)' }}>
                        {action.label}
                    </button>
                )}
            </div>
            {description && <p className="page-description">{description}</p>}
        </div>
    )
}