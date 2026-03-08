import type { SpecFormat } from '@mockline/types'

// Detects whether a spec string is YAML or JSON.
export function detectFormat(content: string): SpecFormat {
    const trimmed = content.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return 'JSON'
    }
    return 'YAML'
}
