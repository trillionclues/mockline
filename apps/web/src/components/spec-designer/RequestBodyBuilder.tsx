'use client'
import type { BuilderRequestBody } from '@/lib/spec-builder/types'
import { SchemaFieldBuilder } from './SchemaFieldBuilder'

type Props = {
    body: BuilderRequestBody | null
    onChange: (body: BuilderRequestBody | null) => void
}

export function RequestBodyBuilder({ body, onChange }: Props) {
    const handleEnable = () => {
        onChange({
            required: true,
            description: '',
            schema: { type: 'object', fields: [] },
        })
    }

    if (!body) {
        return (
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Request Body</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-subtle)', marginBottom: '12px' }}>
                    No request body defined for this endpoint.
                </div>
                <button className="btn-secondary" style={{ height: '36px', fontSize: '12px' }} onClick={handleEnable}>
                    + Add request body
                </button>
            </div>
        )
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Request Body</span>
                <button
                    className="btn-secondary"
                    style={{ height: '36px', fontSize: '12px', color: 'var(--color-destructive)', borderColor: 'var(--color-destructive)' }}
                    onClick={() => onChange(null)}
                >
                    Remove body
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text)', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={body.required}
                        onChange={e => onChange({ ...body, required: e.target.checked })}
                        style={{ accentColor: 'var(--color-primary)' }}
                    />
                    Required
                </label>

                <div className="form-field">
                    <label className="form-label">Description <span className="form-label-optional">(optional)</span></label>
                    <input
                        type="text"
                        className="form-input"
                        value={body.description}
                        onChange={e => onChange({ ...body, description: e.target.value })}
                        placeholder="Request body description"
                        style={{ fontSize: '13px' }}
                    />
                </div>

                <div>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: 'var(--color-text)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}>
                        Body Schema (application/json)
                    </div>
                    <SchemaFieldBuilder
                        fields={body.schema.fields}
                        onChange={fields => onChange({ ...body, schema: { ...body.schema, fields } })}
                    />
                </div>
            </div>
        </div>
    )
}
