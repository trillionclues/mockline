'use client'
import { CopyButton } from '@/components/shared/CopyButton'
import { Download, X } from 'lucide-react'

type Props = {
    content: string
    format: 'YAML' | 'JSON'
    onToggleFormat: () => void
    onClose?: () => void
}

export function YamlPreviewPanel({ content, format, onToggleFormat, onClose }: Props) {
    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `spec.${format.toLowerCase()}`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'var(--color-bg)',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid var(--color-border)',
                flexShrink: 0,
            }}>
                <button
                    onClick={onToggleFormat}
                    style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                    }}
                >
                    {format} ↕
                </button>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <CopyButton value={content} />
                    <button className="btn-icon" onClick={handleDownload} title="Download">
                        <Download size={12} />
                    </button>
                    {onClose && (
                        <button className="btn-icon spec-designer-preview-close" onClick={onClose} title="Close preview">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <pre style={{
                flex: 1,
                overflow: 'auto',
                margin: 0,
                padding: '12px',
                fontSize: '11px',
                lineHeight: 1.6,
                color: 'var(--color-text)',
                whiteSpace: 'pre',
            }}>
                {content}
            </pre>
        </div>
    )
}
