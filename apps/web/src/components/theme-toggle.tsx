'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle({ size = 'default' }: { size?: 'default' | 'small' }) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if (!mounted) {
        return (
            <div style={{
                width: size === 'small' ? '32px' : '36px',
                height: size === 'small' ? '32px' : '36px',
            }} />
        )
    }

    const cycle = () => {
        if (theme === 'system') setTheme('light')
        else if (theme === 'light') setTheme('dark')
        else setTheme('system')
    }

    const iconSize = size === 'small' ? 14 : 16
    const btnSize = size === 'small' ? '32px' : '36px'

    return (
        <button
            onClick={cycle}
            aria-label={`Theme: ${theme}. Click to change.`}
            title={`Theme: ${theme}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: btnSize,
                height: btnSize,
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                transition: 'color 150ms ease, border-color 150ms ease',
                flexShrink: 0,
            }}
        >
            {theme === 'light' && <Sun size={iconSize} />}
            {theme === 'dark' && <Moon size={iconSize} />}
            {theme === 'system' && <Monitor size={iconSize} />}
        </button>
    )
}
