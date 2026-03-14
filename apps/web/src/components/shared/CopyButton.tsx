'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation()
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <button onClick={handleCopy} className="copy-btn" title="Copy">
            {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
    )
}