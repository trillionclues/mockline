'use client'
import { useState } from 'react'

type Props = {
    open: boolean
    onClose: () => void
    title: string
    description: string
    confirmWord?: string
    onConfirm: () => Promise<void>
    variant?: 'default' | 'destructive'
    confirmText?: string
    loadingText?: string
}

export function ConfirmDialog({ open, onClose, title, description, confirmWord, onConfirm, variant = 'default', confirmText, loadingText }: Props) {
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)

    if (!open) return null

    const canConfirm = !confirmWord || input === confirmWord
    const isDestructive = variant === 'destructive'

    const handleConfirm = async () => {
        if (!canConfirm || loading) return
        setLoading(true)
        try {
            await onConfirm()
            setInput('')
            onClose()
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '440px' }}>
                <h2 className="modal-title">{title}</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '-8px' }}>
                    {description}
                </p>

                {confirmWord && (
                    <div className="form-field">
                        <input
                            type="text"
                            className="form-input"
                            placeholder={`Type ${confirmWord} to confirm`}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            style={{
                                borderColor: input.length > 0 && !canConfirm
                                    ? 'var(--color-destructive)'
                                    : undefined,
                            }}
                        />
                        {input.length > 0 && !canConfirm && (
                            <span style={{ fontSize: '12px', color: 'var(--color-destructive)' }}>
                                Type {confirmWord} exactly to continue
                            </span>
                        )}
                    </div>
                )}

                <div className="modal-actions">
                    <button onClick={() => { onClose(); setInput('') }} disabled={loading} className="btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm || loading}
                        className={isDestructive ? 'btn-destructive' : 'btn-primary'}
                    >
                        {loading 
                            ? (loadingText || (isDestructive ? 'Deleting...' : 'Confirming...')) 
                            : (confirmText || (isDestructive ? 'Delete' : 'Confirm'))}
                    </button>
                </div>
            </div>
        </div>
    )
}