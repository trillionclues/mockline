'use client'
import { useState, useEffect, useMemo } from 'react'
import type { Endpoint } from '@/types'
import type { ExplorerResponse } from './ExplorerView'
import { explorerApi } from '@/lib/api-client'

type Props = {
    endpoint: Endpoint
    baseUrl: string
    onResponse: (r: ExplorerResponse) => void
}

export function RequestPanel({ endpoint, baseUrl, onResponse }: Props) {
    const [pathParams, setPathParams] = useState<Record<string, string>>({})
    const [queryParams, setQueryParams] = useState<Record<string, string>>({})
    const [headerParams, setHeaderParams] = useState<Record<string, string>>({})
    const [body, setBody] = useState('')
    const [isSending, setIsSending] = useState(false)

    // Derive parameter groups from the spec
    const pathParamDefs = useMemo(
        () => (endpoint.parameters ?? []).filter(p => p.in === 'path'),
        [endpoint.parameters]
    )
    const queryParamDefs = useMemo(
        () => (endpoint.parameters ?? []).filter(p => p.in === 'query'),
        [endpoint.parameters]
    )
    const headerParamDefs = useMemo(
        () => (endpoint.parameters ?? []).filter(p => p.in === 'header'),
        [endpoint.parameters]
    )

    const hasBody = !!endpoint.requestBody || ['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase())

    // Reset state when endpoint changes
    useEffect(() => {
        setPathParams({})
        setQueryParams({})
        setHeaderParams({})
        setBody('')
    }, [endpoint.path, endpoint.method])

    // Build validation warnings
    const missingRequired = useMemo(() => {
        const missing: string[] = []
        for (const p of pathParamDefs) {
            if (p.required && !pathParams[p.name]?.trim()) missing.push(`Path: ${p.name}`)
        }
        for (const p of headerParamDefs) {
            if (p.required && !headerParams[p.name]?.trim()) missing.push(`Header: ${p.name}`)
        }
        if (endpoint.requestBody?.required && !body.trim()) missing.push('Request Body')
        return missing
    }, [pathParamDefs, headerParamDefs, pathParams, headerParams, body, endpoint.requestBody])

    const handleSend = async () => {
        setIsSending(true)

        try {
            let url = `${baseUrl}${endpoint.path}`

            // Substitute path params
            for (const [key, val] of Object.entries(pathParams)) {
                url = url.replace(`{${key}}`, encodeURIComponent(val || key))
            }

            // Append query params
            const qs = new URLSearchParams()
            for (const [key, val] of Object.entries(queryParams)) {
                if (val.trim()) qs.set(key, val)
            }
            if (qs.size) url += `?${qs.toString()}`

            // Build headers from spec-defined header params
            const headers: Record<string, string> = {
                'Content-Type': endpoint.requestBody?.contentType ?? 'application/json',
            }
            for (const [key, val] of Object.entries(headerParams)) {
                if (val.trim()) headers[key] = val
            }

            const hasBodyContent = hasBody && body.trim()

            // Proxy through our API to avoid CORS
            const result = await explorerApi.proxy({
                url,
                method: endpoint.method.toUpperCase(),
                headers,
                body: hasBodyContent ? body : undefined,
            })

            onResponse({
                status: result.status,
                statusText: result.statusText,
                headers: result.headers,
                body: result.body,
                error: result.error,
                duration: result.duration,
            })
        } catch (err) {
            onResponse({ error: String(err), duration: 0 })
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className={`method-badge method-${endpoint.method.toLowerCase()}`} style={{ fontSize: '12px', padding: '3px 8px' }}>
                    {endpoint.method}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--color-text-strong)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {endpoint.path}
                </span>
                {endpoint.summary && (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>— {endpoint.summary}</span>
                )}
            </div>

            {endpoint.responses && Object.keys(endpoint.responses).length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {Object.entries(endpoint.responses).map(([code, res]) => (
                        <span
                            key={code}
                            title={res.description}
                            style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: 600,
                                background: Number(code) >= 400
                                    ? 'rgba(239, 68, 68, 0.1)'
                                    : Number(code) >= 300
                                        ? 'rgba(234, 179, 8, 0.1)'
                                        : 'rgba(34, 197, 94, 0.1)',
                                color: Number(code) >= 400
                                    ? 'var(--color-status-failed)'
                                    : Number(code) >= 300
                                        ? 'var(--color-warning)'
                                        : 'var(--color-status-running)',
                            }}
                        >
                            {code} {res.description}
                        </span>
                    ))}
                </div>
            )}

            {/* Path Parameters */}
            {pathParamDefs.length > 0 && (
                <ParamSection title="Path Parameters">
                    {pathParamDefs.map(p => (
                        <ParamRow
                            key={p.name}
                            name={p.name}
                            required={p.required}
                            placeholder={p.schema?.type ? `${p.schema.type}` : `Enter ${p.name}`}
                            value={pathParams[p.name] ?? ''}
                            onChange={v => setPathParams(prev => ({ ...prev, [p.name]: v }))}
                        />
                    ))}
                </ParamSection>
            )}

            {/* Query Parameters */}
            {queryParamDefs.length > 0 && (
                <ParamSection title="Query Parameters">
                    {queryParamDefs.map(p => (
                        <ParamRow
                            key={p.name}
                            name={p.name}
                            required={p.required}
                            placeholder={p.schema?.type ? `${p.schema.type}` : `Enter ${p.name}`}
                            value={queryParams[p.name] ?? ''}
                            onChange={v => setQueryParams(prev => ({ ...prev, [p.name]: v }))}
                        />
                    ))}
                </ParamSection>
            )}

            {headerParamDefs.length > 0 && (
                <ParamSection title="Headers">
                    {headerParamDefs.map(p => (
                        <ParamRow
                            key={p.name}
                            name={p.name}
                            required={p.required}
                            placeholder={p.schema?.type ? `${p.schema.type}` : `Enter ${p.name}`}
                            value={headerParams[p.name] ?? ''}
                            onChange={v => setHeaderParams(prev => ({ ...prev, [p.name]: v }))}
                        />
                    ))}
                </ParamSection>
            )}

            {hasBody && (
                <div>
                    <div className="form-label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Request Body
                        {endpoint.requestBody?.contentType && (
                            <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)', fontWeight: 400 }}>
                                ({endpoint.requestBody.contentType})
                            </span>
                        )}
                        {endpoint.requestBody?.required && (
                            <span style={{ fontSize: '10px', color: 'var(--color-status-failed)', fontWeight: 600 }}>required</span>
                        )}
                    </div>
                    <textarea
                        className="form-textarea"
                        rows={6}
                        placeholder={'{\n  "key": "value"\n}'}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        style={{ fontSize: '12px', resize: 'vertical', fontFamily: 'monospace' }}
                    />
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                {missingRequired.length > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--color-warning)' }}>
                        Missing required: {missingRequired.join(', ')}
                    </span>
                )}
                <button onClick={handleSend} disabled={isSending} className="btn-primary" style={{ marginLeft: 'auto' }}>
                    {isSending ? 'Sending...' : 'Send Request'}
                </button>
            </div>
        </div>
    )
}

function ParamSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="form-label" style={{ marginBottom: '8px' }}>{title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {children}
            </div>
        </div>
    )
}

function ParamRow({ name, required, placeholder, value, onChange }: {
    name: string
    required: boolean
    placeholder: string
    value: string
    onChange: (v: string) => void
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', width: '140px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace' }}>
                {name}
                {required && <span style={{ color: 'var(--color-status-failed)', fontSize: '10px' }}>*</span>}
            </span>
            <input
                type="text"
                className="form-input"
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{ fontSize: '12px', fontFamily: 'monospace' }}
            />
        </div>
    )
}