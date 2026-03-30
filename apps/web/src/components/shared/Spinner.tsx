import { Loader2 } from 'lucide-react'

export function Spinner({ size = 16, className = "", color }: { size?: number, className?: string, color?: string }) {
    return (
        <Loader2
            size={size}
            color={color}
            className={className}
            style={{ animation: 'spin 1s linear infinite' }}
        />
    )
}
