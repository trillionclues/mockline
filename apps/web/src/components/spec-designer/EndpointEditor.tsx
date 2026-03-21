'use client'
import { useState } from 'react'
import type { BuilderEndpoint, BuilderParam, BuilderRequestBody, BuilderResponse } from '@/lib/spec-builder/types'
import { PathParamBuilder } from './PathParamBuilder'
import { QueryParamBuilder } from './QueryParamBuilder'
import { RequestBodyBuilder } from './RequestBodyBuilder'
import { ResponseBuilder } from './ResponseBuilder'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
const HAS_BODY = ['POST', 'PUT', 'PATCH']

type Props = {
    endpoint: BuilderEndpoint
    onChange: (updated: BuilderEndpoint) => void
}

type Tab = 'details' | 'params' | 'body' | 'responses'

export function EndpointEditor({ endpoint, onChange }: Props) {
    const [tab, setTab] = useState<Tab>('details')

    const update = (partial: Partial<BuilderEndpoint>) =>
        onChange({ ...endpoint, ...partial })

    const pathParams = endpoint.path.match(/\{(\w+)\}/g)?.map(p => p.slice(1, -1)) ?? []

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--color-border)',
                padding: '0 16px',
                gap: '0',
                background: 'var(--color-bg)',
                flexShrink: 0,
            }}>
                {(['details', 'params', 'body', 'responses'] as Tab[]).map(t => {
                    const labels = { details: 'Details', params: 'Parameters', body: 'Request Body', responses: 'Responses' }
                    const disabled = t === 'body' && !HAS_BODY.includes(endpoint.method)
                    return (
                        <button
                            key={t}
                            onClick={() => !disabled && setTab(t)}
                            disabled={disabled}
                            style={{
                                padding: '10px 14px',
                                fontSize: '12px',
                                fontWeight: tab === t ? 500 : 400,
                                color: tab === t ? 'var(--color-text-strong)' : 'var(--color-text)',
                                background: 'none',
                                border: 'none',
                                borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
                                cursor: disabled ? 'default' : 'pointer',
                                opacity: disabled ? 0.4 : 1,
                                marginBottom: '-1px',
                            }}
                        >
                            {labels[t]}
                        </button>
                    )
                })}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                {tab === 'details' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '560px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                            <div className="form-field" style={{ flexShrink: 0 }}>
                                <label className="form-label">Method</label>
                                <select
                                    value={endpoint.method}
                                    onChange={e => update({ method: e.target.value as BuilderEndpoint['method'] })}
                                    className="form-select"
                                    style={{ width: '100px' }}
                                >
                                    {METHODS.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field" style={{ flex: 1 }}>
                                <label className="form-label">Path</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={endpoint.path}
                                    onChange={e => update({ path: e.target.value })}
                                    placeholder="/users/{id}"
                                    style={{ fontSize: '13px' }}
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="form-label">Summary <span className="form-label-optional">(short description)</span></label>
                            <input
                                type="text"
                                className="form-input"
                                value={endpoint.summary}
                                onChange={e => update({ summary: e.target.value })}
                                placeholder="List all users..."
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">Description <span className="form-label-optional">(optional)</span></label>
                            <textarea
                                className="form-textarea"
                                value={endpoint.description}
                                onChange={e => update({ description: e.target.value })}
                                placeholder="Returns a paginated list of users..."
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">Tag <span className="form-label-optional">(groups endpoints in docs)</span></label>
                            <input
                                type="text"
                                className="form-input"
                                value={endpoint.tag ?? ''}
                                onChange={e => update({ tag: e.target.value || undefined })}
                                placeholder="Users"
                            />
                        </div>
                    </div>
                )}

                {tab === 'params' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '560px' }}>
                        {pathParams.length > 0 && (
                            <PathParamBuilder
                                params={endpoint.pathParams}
                                detectedNames={pathParams}
                                onChange={(updated: BuilderParam[]) => update({ pathParams: updated })}
                            />
                        )}
                        <QueryParamBuilder
                            params={endpoint.queryParams}
                            onChange={(updated: BuilderParam[]) => update({ queryParams: updated })}
                        />
                    </div>
                )}

                {tab === 'body' && HAS_BODY.includes(endpoint.method) && (
                    <div style={{ maxWidth: '560px' }}>
                        <RequestBodyBuilder
                            body={endpoint.requestBody}
                            onChange={(updated: BuilderRequestBody | null) => update({ requestBody: updated })}
                        />
                    </div>
                )}

                {tab === 'responses' && (
                    <div style={{ maxWidth: '560px' }}>
                        <ResponseBuilder
                            responses={endpoint.responses}
                            onChange={(updated: BuilderResponse[]) => update({ responses: updated })}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
