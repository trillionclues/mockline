'use client'
import { useState, useMemo } from 'react'
import type { ExplorerResponse } from './ExplorerView'

function statusColor(code: number) {
    if (code >= 500) return '#ef4444'
    if (code >= 400) return '#f59e0b'
    if (code >= 300) return 'var(--color-text-muted)'
    return '#22c55e'
}

function statusBg(code: number) {
    if (code >= 500) return 'rgba(239, 68, 68, 0.08)'
    if (code >= 400) return 'rgba(245, 158, 11, 0.08)'
    if (code >= 300) return 'rgba(148, 163, 184, 0.08)'
    return 'rgba(34, 197, 94, 0.08)'
}

// Syntax-highlight JSON keys, strings, numbers, booleans, nulls
// function highlightJson(json: string): React.ReactNode[] {
//     const lines = json.split('\n')
//     return lines.map((line, i) => {
//         const parts: React.ReactNode[] = []
//         let remaining = line
//         let keyIdx = 0

//         // Match patterns: "key": , "string value", numbers, booleans, null
//         const regex = /("(?:[^"\\]|\\.)*")\s*(:)?|(\b\d+\.?\d*\b)|(\btrue\b|\bfalse\b)|(\bnull\b)/g
//         let match: RegExpExecArray | null
//         let lastIndex = 0

//         while ((match = regex.exec(remaining)) !== null) {
//             // Add plain text before this match
//             if (match.index > lastIndex) {
//                 parts.push(remaining.slice(lastIndex, match.index))
//             }

//             if (match[1]) {
//                 if (match[2]) {
//                     // It's a key: "key":
//                     parts.push(
//                         <span key={`k-${i}-${keyIdx}`} style={{ color: 'var(--color-primary)' }}>{match[1]}</span>
//                     )
//                     parts.push(match[2])
//                 } else {
//                     // It's a string value
//                     parts.push(
//                         <span key={`s-${i}-${keyIdx}`} style={{ color: '#22c55e' }}>{match[1]}</span>
//                     )
//                 }
//             } else if (match[3]) {
//                 // Number
//                 parts.push(
//                     <span key={`n-${i}-${keyIdx}`} style={{ color: '#f59e0b' }}>{match[3]}</span>
//                 )
//             } else if (match[4]) {
//                 // Boolean
//                 parts.push(
//                     <span key={`b-${i}-${keyIdx}`} style={{ color: '#818cf8' }}>{match[4]}</span>
//                 )
//             } else if (match[5]) {
//                 // null
//                 parts.push(
//                     <span key={`nl-${i}-${keyIdx}`} style={{ color: '#94a3b8' }}>{match[5]}</span>
//                 )
//             }

//             lastIndex = match.index + match[0].length
//             keyIdx++
//         }

//         // remaining plain text
//         if (lastIndex < remaining.length) {
//             parts.push(remaining.slice(lastIndex))
//         }

//         return (
//             <div key={i} style={{ display: 'flex' }}>
//                 <span style={{ color: 'var(--color-text-subtle)', userSelect: 'none', width: '36px', textAlign: 'right', paddingRight: '16px', flexShrink: 0, fontSize: '11px', lineHeight: '1.7' }}>
//                     {i + 1}
//                 </span>
//                 <span style={{ flex: 1, whiteSpace: 'pre' }}>{parts}</span>
//             </div>
//         )
//     })
// }

export function ResponsePanel({ response }: { response: ExplorerResponse }) {
    const [headersOpen, setHeadersOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    const formattedBody = useMemo(() => {
        if (typeof response.body === 'string') return response.body
        return JSON.stringify(response.body, null, 2)
    }, [response.body])

    const isJson = typeof response.body !== 'string'

    const handleCopy = async () => {
        await navigator.clipboard.writeText(formattedBody)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (response.error) {
        return (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-status-failed)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--color-status-failed)', fontFamily: 'monospace' }}>
                    {response.error}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px' }}>{response.duration}ms</div>
            </div>
        )
    }

    return (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface-2)',
            }}>
                <span style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    padding: '2px 10px',
                    borderRadius: '4px',
                    color: statusColor(response.status!),
                    background: statusBg(response.status!),
                }}>
                    {response.status}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{response.statusText}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)' }}>{response.duration}ms</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)' }}>
                        {new Blob([formattedBody]).size > 1024
                            ? `${(new Blob([formattedBody]).size / 1024).toFixed(1)} KB`
                            : `${new Blob([formattedBody]).size} B`
                        }
                    </span>
                </div>
            </div>

            {response.headers && (
                <div style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => setHeadersOpen(o => !o)}
                        style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 16px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <span style={{ fontSize: '10px', transition: 'transform 150ms', display: 'inline-block', transform: headersOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                        Response Headers
                        <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)' }}>({Object.keys(response.headers).length})</span>
                    </button>
                    {headersOpen && (
                        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {Object.entries(response.headers).map(([k, v]) => (
                                <div key={k} style={{ fontSize: '11px', fontFamily: 'monospace', display: 'flex', gap: '8px' }}>
                                    <span style={{ color: 'var(--color-primary)', flexShrink: 0 }}>{k}:</span>
                                    <span style={{ color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>{v}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 16px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface-2)',
            }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {isJson ? 'JSON' : 'Text'}
                </span>
                <button
                    onClick={handleCopy}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        padding: '3px 10px',
                        fontSize: '11px',
                        color: copied ? '#22c55e' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                        transition: 'all 150ms',
                    }}
                >
                    {copied ? '✓ Copied' : 'Copy'}
                </button>
            </div>

            <div style={{
                padding: '12px 0',
                fontSize: '12px',
                fontFamily: 'monospace',
                lineHeight: '1.7',
                overflowX: 'auto',
                // maxHeight: '500px',
                height: '100%',
                paddingBottom: '120px',
                overflowY: 'auto',
                color: 'var(--color-text)',
                background: 'var(--color-bg)',
            }}>
                {/* {isJson ? highlightJson(formattedBody) : ( */}
                {isJson && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {formattedBody.split('\n').map((line, i) => (
                            <div key={i} style={{ display: 'flex', minHeight: '20px' }}>
                                <span style={{
                                    color: 'var(--color-text-subtle)',
                                    userSelect: 'none',
                                    width: '40px',
                                    textAlign: 'right',
                                    paddingRight: '16px',
                                    flexShrink: 0,
                                    fontSize: '11px',
                                    lineHeight: '1.7',
                                    opacity: 0.5,
                                }}>{i + 1}</span>
                                <span style={{ flex: 1, whiteSpace: 'pre', lineHeight: '1.7' }}>{line}</span>
                            </div>
                        ))}
                    </div>
                )}
                {!isJson && formattedBody && (
                    <pre style={{ margin: 0, padding: '0 16px', whiteSpace: 'pre-wrap' }}>{formattedBody}</pre>
                )}
            </div>
        </div>
    )
}