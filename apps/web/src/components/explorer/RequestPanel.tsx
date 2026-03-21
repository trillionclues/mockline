'use client'
import { useState, useEffect } from 'react'
import type { Endpoint } from '@/types'
import type { ExplorerResponse } from './ExplorerView'

type Props = {
    endpoint: Endpoint
    baseUrl: string
    onResponse: (r: ExplorerResponse) => void
}

// Extract {paramName} from path strings
function extractPathParams(path: string): string[] {
    return (path.match(/\{(\w+)\}/g) ?? []).map(m => m.slice(1, -1))
}

export function RequestPanel({ endpoint, baseUrl, onResponse }: Props) {
    const [pathParams, setPathParams] = useState<Record<string, string>>({})
    const [queryParams, setQueryParams] = useState('')   // "key=value\nkey2=value2"
    const [body, setBody] = useState('')
    const [isSending, setIsSending] = useState(false)

    const paramNames = extractPathParams(endpoint.path)
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase())

    // Reset state when endpoint changes
    useEffect(() => {
        setPathParams({})
        setQueryParams('')
        setBody('')
    }, [endpoint.path, endpoint.method])

    const handleSend = async () => {
        setIsSending(true)
        const start = Date.now()

        try {
            let url = `${baseUrl}${endpoint.path}`

            // Substitute path params
            for (const [key, val] of Object.entries(pathParams)) {
                url = url.replace(`{${key}}`, encodeURIComponent(val))
            }

            // Append query params
            const pairs = queryParams
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.includes('='))
                .map(l => l.split('=', 2) as [string, string])
            const qs = new URLSearchParams(pairs.filter(([k]) => k))
            if (qs.size) url += `?${qs.toString()}`

            const res = await fetch(url, {
                method: endpoint.method.toUpperCase(),
                headers: { 'Content-Type': 'application/json' },
                body: hasBody && body.trim() ? body : undefined,
            })

            let responseBody: unknown
            const contentType = res.headers.get('content-type') ?? ''
            if (contentType.includes('application/json')) {
                responseBody = await res.json()
            } else {
                responseBody = await res.text()
            }

            onResponse({
                status: res.status,
                statusText: res.statusText,
                headers: Object.fromEntries(res.headers.entries()),
                body: responseBody,
                duration: Date.now() - start,
            })
        } catch (err) {
            onResponse({ error: String(err), duration: Date.now() - start })
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`method-badge method-${endpoint.method.toLowerCase()}`} style={{ fontSize: '12px', padding: '3px 8px' }}>
                    {endpoint.method}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--color-text-strong)' }}>
                    {endpoint.path}
                </span>
                {endpoint.summary && (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>— {endpoint.summary}</span>
                )}
            </div>

            {paramNames.length > 0 && (
                <div>
                    <div className="form-label" style={{ marginBottom: '8px' }}>Path Parameters</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {paramNames.map(name => (
                            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', width: '120px', flexShrink: 0 }}>
                                    {name}
                                </span>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={`Enter ${name}`}
                                    value={pathParams[name] ?? ''}
                                    onChange={e => setPathParams(p => ({ ...p, [name]: e.target.value }))}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="form-field">
                <label className="form-label">
                    Query Parameters
                    <span className="form-label-optional"> — one per line, key=value</span>
                </label>
                <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder={'page=1\nlimit=20'}
                    value={queryParams}
                    onChange={e => setQueryParams(e.target.value)}
                    style={{ fontSize: '12px', resize: 'vertical' }}
                />
            </div>

            {hasBody && (
                <div className="form-field">
                    <label className="form-label">Request Body <span className="form-label-optional">(JSON)</span></label>
                    <textarea
                        className="form-textarea"
                        rows={6}
                        placeholder={'{\n  "key": "value"\n}'}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        style={{ fontSize: '12px', resize: 'vertical' }}
                    />
                </div>
            )}

            <button onClick={handleSend} disabled={isSending} className="btn-primary" style={{ alignSelf: 'flex-end' }}>
                {isSending ? 'Sending...' : 'Send Request'}
            </button>
        </div>
    )
}