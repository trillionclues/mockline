'use client'
import type { BuilderParam, BuilderSchemaField } from '@/lib/spec-builder/types'
import { Trash2, Plus } from 'lucide-react'

const TYPES = ['string', 'number', 'integer', 'boolean'] as const

type Props = {
    params: BuilderParam[]
    onChange: (params: BuilderParam[]) => void
}

export function QueryParamBuilder({ params, onChange }: Props) {
    const addParam = () => {
        const newParam: BuilderParam = {
            id: crypto.randomUUID(),
            name: '',
            description: '',
            required: false,
            schema: { type: 'string', fields: [] },
        }
        onChange([...params, newParam])
    }

    const updateParam = (id: string, partial: Partial<BuilderParam>) => {
        onChange(params.map(p => p.id === id ? { ...p, ...partial } : p))
    }

    const deleteParam = (id: string) => {
        onChange(params.filter(p => p.id !== id))
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Query Parameters</span>
                <button className="btn-secondary" style={{ height: '28px', width: '150px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={addParam}>
                    <Plus size={12} style={{ marginRight: '4px' }} /> Add param
                </button>
            </div>

            {params.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--color-text-subtle)', padding: '8px 0' }}>
                    No query parameters defined.
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {params.map(param => (
                    <div key={param.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                    }}>
                        <input
                            type="text"
                            className="form-input"
                            value={param.name}
                            onChange={e => updateParam(param.id, { name: e.target.value })}
                            placeholder="name"
                            style={{ width: '150px', fontSize: '12px', height: '36px', flexShrink: 0 }}
                        />
                        <select
                            value={param.schema.type}
                            onChange={e => updateParam(param.id, {
                                schema: { ...param.schema, type: e.target.value as BuilderSchemaField['type'] }
                            })}
                            className="form-select"
                            style={{ width: '100px', height: '36px', fontSize: '12px', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                        >
                            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input
                            type="text"
                            className="form-input"
                            value={param.description}
                            onChange={e => updateParam(param.id, { description: e.target.value })}
                            placeholder="description"
                            style={{ flex: 1, fontSize: '12px', height: '36px' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--color-text)', cursor: 'pointer', flexShrink: 0 }}>
                            <input
                                type="checkbox"
                                checked={param.required}
                                onChange={e => updateParam(param.id, { required: e.target.checked })}
                                style={{ accentColor: 'var(--color-primary)', width: '12px', height: '12px' }}
                            />
                            req
                        </label>
                        <button
                            className="btn-icon destructive"
                            style={{ width: '24px', height: '24px', flexShrink: 0 }}
                            onClick={() => deleteParam(param.id)}
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
