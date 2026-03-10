import { FileCode2 } from 'lucide-react'

export function SpecsEmptyState({ onUpload }: { onUpload: () => void }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            background: 'var(--color-surface)',
            border: '1px dashed var(--color-border)',
            borderRadius: '12px',
            textAlign: 'center',
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: 'var(--color-surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
            }}>
                <FileCode2 size={24} color="var(--color-text-muted)" />
            </div>

            <h3 style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--color-text-strong)',
                marginBottom: '8px',
            }}>
                No OpenAPI specs yet
            </h3>

            <p style={{
                fontFamily: 'var(--font-family-sans)',
                fontSize: '14px',
                color: 'var(--color-text-muted)',
                marginBottom: '24px',
                maxWidth: '320px',
            }}>
                Upload your first OpenAPI specification to start provisioning mock servers and testing contracts.
            </p>

            <button
                onClick={onUpload}
                style={{
                    height: '36px',
                    padding: '0 16px',
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-family-sans)',
                    fontWeight: 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-text-muted)'
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'
                }}
            >
                Upload Spec
            </button>
        </div>
    )
}
