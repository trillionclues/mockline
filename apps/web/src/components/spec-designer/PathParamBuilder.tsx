'use client'
import type { BuilderParam } from '@/lib/spec-builder/types'

type Props = {
    params: BuilderParam[]
    detectedNames: string[]
    onChange: (params: BuilderParam[]) => void
}

export function PathParamBuilder({ params, detectedNames, onChange }: Props) {
    const ensuredParams = detectedNames.map(name => {
        const existing = params.find(p => p.name === name)
        if (existing) return existing
        return {
            id: crypto.randomUUID(),
            name,
            description: '',
            required: true,
            schema: { type: 'string' as const, fields: [] },
        }
    })

    // Sync if new params added
    if (ensuredParams.length !== params.length || ensuredParams.some((p, i) => p.id !== params[i]?.id)) {
        queueMicrotask(() => onChange(ensuredParams))
    }

    const updateParam = (id: string, partial: Partial<BuilderParam>) => {
        onChange(ensuredParams.map(p => p.id === id ? { ...p, ...partial } : p))
    }

    return (
        <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '12px' }}>
                Path Parameters
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ensuredParams.map(param => (
                    <div key={param.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                    }}>
                        <span style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'var(--color-text-strong)',
                            width: '100px',
                            flexShrink: 0,
                        }}>
                            {'{' + param.name + '}'}
                        </span>
                        <input
                            type="text"
                            className="form-input"
                            value={param.description}
                            onChange={e => updateParam(param.id, { description: e.target.value })}
                            placeholder="Description (optional)"
                            style={{ flex: 1, fontSize: '12px', height: '28px' }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--color-text-subtle)', flexShrink: 0 }}>
                            required
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
