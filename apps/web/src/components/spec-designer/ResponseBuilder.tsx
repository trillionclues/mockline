'use client'
import { useState } from 'react'
import type { BuilderResponse } from '@/lib/spec-builder/types'
import { SchemaFieldBuilder } from './SchemaFieldBuilder'
import { Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'

const COMMON_CODES = ['200', '201', '204', '400', '401', '403', '404', '422', '500']

type Props = {
    responses: BuilderResponse[]
    onChange: (responses: BuilderResponse[]) => void
}

export function ResponseBuilder({ responses, onChange }: Props) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(
        responses.length > 0 ? [responses[0].id] : []
    ))

    const addResponse = () => {
        const usedCodes = new Set(responses.map(r => r.statusCode))
        const nextCode = COMMON_CODES.find(c => !usedCodes.has(c)) ?? '200'
        const newResponse: BuilderResponse = {
            id: crypto.randomUUID(),
            statusCode: nextCode,
            description: nextCode === '200' ? 'Success' : nextCode === '201' ? 'Created' : nextCode === '204' ? 'No content' : nextCode === '400' ? 'Bad request' : nextCode === '401' ? 'Unauthorized' : nextCode === '403' ? 'Forbidden' : nextCode === '404' ? 'Not found' : nextCode === '422' ? 'Unprocessable entity' : nextCode === '500' ? 'Internal server error' : '',
            schema: { type: 'object', fields: [] },
        }
        onChange([...responses, newResponse])
        setExpandedIds(prev => new Set([...prev, newResponse.id]))
    }

    const updateResponse = (id: string, partial: Partial<BuilderResponse>) => {
        onChange(responses.map(r => r.id === id ? { ...r, ...partial } : r))
    }

    const deleteResponse = (id: string) => {
        onChange(responses.filter(r => r.id !== id))
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
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Responses</span>
                <button className="btn-secondary" style={{ height: '36px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={addResponse}>
                    <Plus size={12} style={{ marginRight: '4px' }} /> Add response
                </button>
            </div>

            {responses.map(response => {
                const isExpanded = expandedIds.has(response.id)
                const statusNum = parseInt(response.statusCode)
                const statusColor = statusNum >= 500 ? 'var(--color-status-failed)'
                    : statusNum >= 400 ? 'var(--color-warning)'
                        : 'var(--color-status-running)'

                return (
                    <div key={response.id} style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        overflow: 'hidden',
                    }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                background: 'var(--color-surface-2)',
                                cursor: 'pointer',
                            }}
                            onClick={() => toggleExpand(response.id)}
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}

                            <select
                                value={response.statusCode}
                                onChange={e => { e.stopPropagation(); updateResponse(response.id, { statusCode: e.target.value }) }}
                                onClick={e => e.stopPropagation()}
                                className="form-select"
                                style={{ width: '100px', height: '36px', fontSize: '12px', color: statusColor }}
                            >
                                {COMMON_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <input
                                type="text"
                                className="form-input"
                                value={response.description}
                                onChange={e => { e.stopPropagation(); updateResponse(response.id, { description: e.target.value }) }}
                                onClick={e => e.stopPropagation()}
                                placeholder="Description"
                                style={{ flex: 1, height: '36px', fontSize: '12px' }}
                            />

                            <button
                                className="btn-icon destructive"
                                style={{ width: '36px', height: '36px', flexShrink: 0 }}
                                onClick={e => { e.stopPropagation(); deleteResponse(response.id) }}
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>

                        {isExpanded && (
                            <div style={{ padding: '12px 16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Response Body Schema
                                </div>
                                <SchemaFieldBuilder
                                    fields={response.schema?.fields ?? []}
                                    onChange={fields => updateResponse(response.id, {
                                        schema: { ...response.schema!, fields }
                                    })}
                                />
                            </div>
                        )}
                    </div>
                )
            })}

            {responses.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--color-text-subtle)', padding: '8px 0' }}>
                    No responses defined. Add at least a 200 response.
                </div>
            )}
        </div>
    )
}
