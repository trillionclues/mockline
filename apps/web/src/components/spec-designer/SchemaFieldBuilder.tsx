'use client'
import { Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import type { BuilderSchemaField } from '@/lib/spec-builder/types'
import { useState } from 'react'

const TYPES = ['string', 'number', 'integer', 'boolean', 'object', 'array'] as const
const FORMATS: Record<string, string[]> = {
    string: ['none', 'date', 'date-time', 'email', 'uuid', 'uri', 'password'],
    integer: ['none', 'int32', 'int64'],
    number: ['none', 'float', 'double'],
}

type Props = {
    fields: BuilderSchemaField[]
    onChange: (fields: BuilderSchemaField[]) => void
    depth?: number   // for visual nesting indent
}

export function SchemaFieldBuilder({ fields, onChange, depth = 0 }: Props) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    const addField = () => {
        const newField: BuilderSchemaField = {
            id: crypto.randomUUID(),
            name: '',
            type: 'string',
            format: undefined,
            required: false,
            description: '',
            fields: [],
            items: null,
            example: '',
        }
        onChange([...fields, newField])
    }

    const updateField = (id: string, partial: Partial<BuilderSchemaField>) => {
        onChange(fields.map(f => f.id === id ? { ...f, ...partial } : f))
    }

    const deleteField = (id: string) => {
        onChange(fields.filter(f => f.id !== id))
    }

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    return (
        <div style={{ marginLeft: depth > 0 ? '16px' : '0' }}>
            {fields.map(field => {
                const isExpanded = expandedIds.has(field.id)
                const hasChildren = field.type === 'object' || field.type === 'array'
                const availableFormats = FORMATS[field.type] ?? []

                return (
                    <div key={field.id} style={{
                        borderLeft: depth > 0 ? '1px solid var(--color-border)' : 'none',
                        paddingLeft: depth > 0 ? '12px' : '0',
                        marginBottom: '8px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {hasChildren ? (
                                <button
                                    className="btn-icon"
                                    style={{ width: '20px', height: '20px', flexShrink: 0 }}
                                    onClick={() => toggleExpand(field.id)}
                                >
                                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </button>
                            ) : (
                                <span style={{ width: '20px', flexShrink: 0 }} />
                            )}

                            <input
                                type="text"
                                className="form-input"
                                value={field.name}
                                onChange={e => updateField(field.id, { name: e.target.value })}
                                placeholder="fieldName"
                                style={{ flex: 1, fontSize: '12px', height: '36px' }}
                            />

                            <select
                                value={field.type}
                                onChange={e => updateField(field.id, {
                                    type: e.target.value as BuilderSchemaField['type'],
                                    format: undefined,
                                    fields: e.target.value === 'object' ? [] : field.fields,
                                    items: e.target.value === 'array' ? { type: 'string', fields: [] } : null,
                                })}
                                className="form-select"
                                style={{ width: '120px', height: '36px', fontSize: '12px' }}
                            >
                                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            {availableFormats.length > 0 && (
                                <select
                                    value={field.format ?? 'none'}
                                    onChange={e => updateField(field.id, {
                                        format: e.target.value === 'none' ? undefined : e.target.value
                                    })}
                                    className="form-select"
                                    style={{ width: '110px', height: '36px', fontSize: '12px' }}
                                >
                                    {availableFormats.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            )}

                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-muted)', cursor: 'pointer', flexShrink: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={e => updateField(field.id, { required: e.target.checked })}
                                    style={{ accentColor: 'var(--color-primary)', width: '12px', height: '12px' }}
                                />
                                req
                            </label>

                            <button className="btn-icon destructive" style={{ width: '24px', height: '24px', flexShrink: 0 }}
                                onClick={() => deleteField(field.id)}>
                                <Trash2 size={12} />
                            </button>
                        </div>

                        <div style={{ marginLeft: '26px', marginTop: '6px' }}>
                            <input
                                type="text"
                                className="form-input"
                                value={field.example ?? ''}
                                onChange={e => updateField(field.id, { example: e.target.value || undefined })}
                                placeholder="example value (optional)"
                                style={{ fontSize: '11px', height: '26px', color: 'var(--color-text-muted)' }}
                            />
                        </div>
                        {isExpanded && field.type === 'object' && (
                            <div style={{ marginTop: '8px' }}>
                                <SchemaFieldBuilder
                                    fields={field.fields ?? []}
                                    onChange={nested => updateField(field.id, { fields: nested })}
                                    depth={depth + 1}
                                />
                            </div>
                        )}

                        {isExpanded && field.type === 'array' && field.items && (
                            <div style={{ marginTop: '8px', marginLeft: '26px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                    Array item type:
                                </div>
                                <select
                                    value={field.items.type}
                                    onChange={e => updateField(field.id, {
                                        items: { ...field.items!, type: e.target.value as BuilderSchemaField['type'], fields: e.target.value === 'object' ? (field.items!.fields ?? []) : [] }
                                    })}
                                    className="form-select"
                                    style={{ width: '120px', height: '28px', fontSize: '12px' }}
                                >
                                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                {field.items.type === 'object' && (
                                    <div style={{ marginTop: '8px' }}>
                                        <SchemaFieldBuilder
                                            fields={field.items.fields ?? []}
                                            onChange={nested => updateField(field.id, {
                                                items: { ...field.items!, fields: nested }
                                            })}
                                            depth={depth + 1}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}

            <button
                onClick={addField}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: 'var(--color-text)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 0',
                    marginLeft: depth > 0 ? '20px' : '0',
                }}
            >
                <Plus size={12} /> Add field
            </button>
        </div>
    )
}
