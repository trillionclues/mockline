# Mockline — OpenAPI Spec Designer Implementation Guide

> PRO feature. Lets users visually build an OpenAPI 3.0 spec inside Mockline
> without writing YAML or JSON. Outputs a valid spec that becomes a spec version
> in their history and can be provisioned as a mock server immediately.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [User Flow](#2-user-flow)
3. [Data Model](#3-data-model)
4. [File Structure](#4-file-structure)
5. [Phase 1 — Spec Builder Shell](#5-phase-1--spec-builder-shell)
6. [Phase 2 — Endpoint Builder](#6-phase-2--endpoint-builder)
7. [Phase 3 — Schema Builder](#7-phase-3--schema-builder)
8. [Phase 4 — Response Builder](#8-phase-4--response-builder)
9. [Phase 5 — YAML Preview and Export](#9-phase-5--yaml-preview-and-export)
10. [Phase 6 — Save as Spec Version](#10-phase-6--save-as-spec-version)
11. [Phase 7 — Edit Existing Spec](#11-phase-7--edit-existing-spec)
12. [Shared Types](#12-shared-types)
13. [YAML Generation Logic](#13-yaml-generation-logic)
14. [Implementation Checklist](#14-implementation-checklist)

---

## 1. Product Vision

### Why this exists

When a team starts a sprint, the backend contract is often agreed in a Notion doc,
a Slack thread, or someone's head. Mockline's spec designer moves that contract into
a structured, runnable format — so frontend engineers can start building against a
live mock immediately, and the backend team has a formal spec to implement against.

The spec designer is not a code editor. It is a form-driven interface where
non-OpenAPI-experts can define an API without knowing YAML syntax.

### What it produces

A valid OpenAPI 3.0.3 spec that:
- Saves as a new SpecVersion in the user's spec history
- Can be immediately provisioned as a mock server
- Can be downloaded as YAML or JSON
- Can be edited and re-saved as a new version

### Tier gate

PRO and TEAM users only.
FREE users see a LockedFeatureState with upgrade prompt.

---

## 2. User Flow

```
Entry points:
  /specs → "Design Spec" button (PRO badge for FREE users)
  /specs/:id → "New Version" → "Design in editor" option
  /specs/:id/design → direct URL for editing existing spec

Step 1: API Info
  → Name the API (e.g. "Petstore API")
  → Optional: base path, version, description

Step 2: Add endpoints
  → Click "Add Endpoint"
  → Fill in: method, path, summary
  → Add path params, query params
  → Add request body (if POST/PUT/PATCH)
  → Add responses (200, 400, 404, etc.)
  → Save endpoint → appears in endpoint list

Step 3: Repeat for all endpoints

Step 4: Preview YAML
  → Split panel shows generated YAML in real time
  → User can toggle between YAML and JSON preview

Step 5: Save
  → "Save as Spec" → creates new Spec + SpecVersion
  → "Save as New Version" → adds SpecVersion to existing Spec
  → After save → prompt: "Deploy mock server now?"
```

---

## 3. Data Model

No new Prisma models needed. The designer outputs a YAML string that
goes into the existing SpecVersion.content field via the existing
POST /specs and POST /specs/:id/versions endpoints.

The builder state is kept in React state only — it is never persisted
until the user explicitly saves. This keeps the backend unchanged.

---

## 4. File Structure

```
apps/web/src/
  app/(dashboard)/
    specs/
      new/
        page.tsx                        <- new: design new spec (PRO gate)
      [id]/
        design/
          page.tsx                      <- new: edit existing spec in designer

  components/
    spec-designer/
      SpecDesignerView.tsx              <- main shell, manages all builder state
      ApiInfoForm.tsx                   <- step 1: name, base path, description
      EndpointList.tsx                  <- left panel: list of defined endpoints
      EndpointEditor.tsx                <- right panel: edit one endpoint
      PathParamBuilder.tsx              <- sub-component of EndpointEditor
      QueryParamBuilder.tsx             <- sub-component of EndpointEditor
      RequestBodyBuilder.tsx            <- sub-component of EndpointEditor
      ResponseBuilder.tsx               <- sub-component of EndpointEditor
      SchemaFieldBuilder.tsx            <- recursive: builds object/array schemas
      YamlPreviewPanel.tsx              <- live YAML/JSON preview
      SaveSpecModal.tsx                 <- final save: new spec or new version

  lib/
    spec-builder/
      generate-openapi.ts              <- converts builder state to OpenAPI object
      serialize-spec.ts                <- serializes to YAML or JSON string
      parse-spec-to-builder.ts         <- parses existing spec back to builder state
      types.ts                         <- all TypeScript types for builder state
```

---

## 5. Phase 1 — Spec Builder Shell

### Route: /specs/new

```tsx
// app/(dashboard)/specs/new/page.tsx
import { SpecDesignerView } from '@/components/spec-designer/SpecDesignerView'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function NewSpecPage() {
    const session = await getSession()
    if (!session) redirect('/login')
    if (session.user.tier === 'FREE') redirect('/specs?upgrade=designer')

    return <SpecDesignerView mode="new" />
}
```

### Route: /specs/:id/design

```tsx
// app/(dashboard)/specs/[id]/design/page.tsx
import { specsApi } from '@/lib/api-client'
import { headers } from 'next/headers'
import { SpecDesignerView } from '@/components/spec-designer/SpecDesignerView'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'

export default async function DesignSpecPage({ params }: { params: { id: string } }) {
    const session = await getSession()
    if (!session) redirect('/login')
    if (session.user.tier === 'FREE') redirect('/specs?upgrade=designer')

    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    try {
        const [spec, versions] = await Promise.all([
            specsApi.get(params.id, { headers: apiHeaders }),
            specsApi.getVersions(params.id, { headers: apiHeaders }),
        ])

        // Parse the latest version's content back to builder state
        const latestVersion = versions[0] ?? null

        return (
            <SpecDesignerView
                mode="edit"
                existingSpec={spec}
                existingContent={latestVersion?.content ?? null}
                existingFormat={latestVersion?.format ?? 'YAML'}
            />
        )
    } catch {
        notFound()
    }
}
```

### SpecDesignerView.tsx — main shell

```tsx
'use client'
import { useState, useMemo } from 'react'
import type { BuilderState, BuilderEndpoint } from '@/lib/spec-builder/types'
import { generateOpenAPI } from '@/lib/spec-builder/generate-openapi'
import { serializeSpec } from '@/lib/spec-builder/serialize-spec'
import { parseSpecToBuilder } from '@/lib/spec-builder/parse-spec-to-builder'
import { ApiInfoForm } from './ApiInfoForm'
import { EndpointList } from './EndpointList'
import { EndpointEditor } from './EndpointEditor'
import { YamlPreviewPanel } from './YamlPreviewPanel'
import { SaveSpecModal } from './SaveSpecModal'
import type { SpecDetail } from '@/lib/api-client'

type Props = {
    mode: 'new' | 'edit'
    existingSpec?: SpecDetail
    existingContent?: string | null
    existingFormat?: 'YAML' | 'JSON'
}

const EMPTY_STATE: BuilderState = {
    info: { title: '', version: '1.0.0', description: '', basePath: '/api' },
    endpoints: [],
}

export function SpecDesignerView({ mode, existingSpec, existingContent, existingFormat }: Props) {
    const [state, setState] = useState<BuilderState>(() => {
        if (existingContent && existingFormat) {
            try {
                return parseSpecToBuilder(existingContent, existingFormat)
            } catch {
                return EMPTY_STATE
            }
        }
        return EMPTY_STATE
    })

    const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null)
    const [previewFormat, setPreviewFormat] = useState<'YAML' | 'JSON'>('YAML')
    const [saveOpen, setSaveOpen] = useState(false)

    const selectedEndpoint = state.endpoints.find(e => e.id === selectedEndpointId) ?? null

    // Generate YAML/JSON in real time as state changes
    const previewContent = useMemo(() => {
        try {
            const openApiObject = generateOpenAPI(state)
            return serializeSpec(openApiObject, previewFormat)
        } catch {
            return '# Invalid spec — fix errors above'
        }
    }, [state, previewFormat])

    const updateEndpoint = (updated: BuilderEndpoint) => {
        setState(prev => ({
            ...prev,
            endpoints: prev.endpoints.map(e => e.id === updated.id ? updated : e),
        }))
    }

    const addEndpoint = () => {
        const newEndpoint: BuilderEndpoint = {
            id: crypto.randomUUID(),
            method: 'GET',
            path: '/new-endpoint',
            summary: '',
            description: '',
            pathParams: [],
            queryParams: [],
            requestBody: null,
            responses: [
                {
                    id: crypto.randomUUID(),
                    statusCode: '200',
                    description: 'Success',
                    schema: { type: 'object', fields: [] },
                }
            ],
        }
        setState(prev => ({ ...prev, endpoints: [...prev.endpoints, newEndpoint] }))
        setSelectedEndpointId(newEndpoint.id)
    }

    const deleteEndpoint = (id: string) => {
        setState(prev => ({ ...prev, endpoints: prev.endpoints.filter(e => e.id !== id) }))
        if (selectedEndpointId === id) setSelectedEndpointId(null)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', overflow: 'hidden' }}>
            {/* Top bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 24px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-strong)' }}>
                        {mode === 'new' ? 'New Spec' : `Editing: ${existingSpec?.name}`}
                    </span>
                    {state.info.title && (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            {state.info.title}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ height: '32px', fontSize: '12px' }}
                        onClick={() => setPreviewFormat(f => f === 'YAML' ? 'JSON' : 'YAML')}>
                        Show {previewFormat === 'YAML' ? 'JSON' : 'YAML'}
                    </button>
                    <button
                        className="btn-primary"
                        style={{ height: '32px', fontSize: '12px' }}
                        disabled={!state.info.title || state.endpoints.length === 0}
                        onClick={() => setSaveOpen(true)}
                    >
                        Save Spec
                    </button>
                </div>
            </div>

            {/* Three panel layout */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left panel — API info + endpoint list */}
                <div style={{
                    width: '240px',
                    flexShrink: 0,
                    borderRight: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    background: 'var(--color-surface)',
                }}>
                    <ApiInfoForm
                        info={state.info}
                        onChange={info => setState(prev => ({ ...prev, info }))}
                    />
                    <EndpointList
                        endpoints={state.endpoints}
                        selectedId={selectedEndpointId}
                        onSelect={setSelectedEndpointId}
                        onAdd={addEndpoint}
                        onDelete={deleteEndpoint}
                    />
                </div>

                {/* Center panel — endpoint editor */}
                <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
                    {selectedEndpoint ? (
                        <EndpointEditor
                            endpoint={selectedEndpoint}
                            onChange={updateEndpoint}
                        />
                    ) : (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'var(--color-text-muted)',
                            fontSize: '13px',
                            gap: '12px',
                        }}>
                            <span>Select an endpoint to edit, or add a new one</span>
                            <button className="btn-secondary" onClick={addEndpoint}
                                style={{ height: '32px', fontSize: '12px' }}>
                                + Add endpoint
                            </button>
                        </div>
                    )}
                </div>

                {/* Right panel — YAML/JSON preview */}
                <YamlPreviewPanel
                    content={previewContent}
                    format={previewFormat}
                    onToggleFormat={() => setPreviewFormat(f => f === 'YAML' ? 'JSON' : 'YAML')}
                />
            </div>

            <SaveSpecModal
                open={saveOpen}
                onClose={() => setSaveOpen(false)}
                mode={mode}
                existingSpec={existingSpec}
                content={previewContent}
                format={previewFormat}
            />
        </div>
    )
}
```

---

## 6. Phase 2 — Endpoint Builder

### EndpointList.tsx

Left panel listing. Each item shows method badge + path.
Active item has cream left border. Delete button on hover.

```tsx
'use client'
import type { BuilderEndpoint } from '@/lib/spec-builder/types'
import { Trash2, Plus } from 'lucide-react'

type Props = {
    endpoints: BuilderEndpoint[]
    selectedId: string | null
    onSelect: (id: string) => void
    onAdd: () => void
    onDelete: (id: string) => void
}

export function EndpointList({ endpoints, selectedId, onSelect, onAdd, onDelete }: Props) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid var(--color-border)',
                flexShrink: 0,
            }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Endpoints
                </span>
                <button className="btn-icon" onClick={onAdd} title="Add endpoint">
                    <Plus size={14} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {endpoints.length === 0 && (
                    <div style={{ padding: '16px 12px', fontSize: '12px', color: 'var(--color-text-subtle)' }}>
                        No endpoints yet
                    </div>
                )}
                {endpoints.map(ep => (
                    <div
                        key={ep.id}
                        onClick={() => onSelect(ep.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderLeft: `2px solid ${ep.id === selectedId ? 'var(--color-primary)' : 'transparent'}`,
                            background: ep.id === selectedId ? 'var(--color-primary-muted)' : 'transparent',
                            transition: 'background 120ms ease',
                        }}
                    >
                        <span className={`method-badge method-${ep.method.toLowerCase()}`} style={{ flexShrink: 0 }}>
                            {ep.method}
                        </span>
                        <span style={{
                            fontSize: '12px',
                            fontFamily: 'var(--font-family-mono)',
                            color: 'var(--color-text)',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {ep.path}
                        </span>
                        <button
                            className="btn-icon destructive"
                            style={{ width: '20px', height: '20px', opacity: 0, flexShrink: 0 }}
                            onClick={e => { e.stopPropagation(); onDelete(ep.id) }}
                            title="Delete endpoint"
                        >
                            <Trash2 size={11} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
```

Add to globals.css so the delete button shows on row hover:

```css
/* Endpoint list delete button — show on row hover */
.endpoint-list-row:hover .endpoint-delete-btn {
    opacity: 1 !important;
}
```

### EndpointEditor.tsx — main editor panel

Tabs: Details | Parameters | Request Body | Responses

```tsx
'use client'
import { useState } from 'react'
import type { BuilderEndpoint } from '@/lib/spec-builder/types'
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
            {/* Tab bar */}
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
                                color: tab === t ? 'var(--color-text-strong)' : 'var(--color-text-muted)',
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

            {/* Tab content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                {tab === 'details' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '560px' }}>
                        {/* Method + path on same row */}
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
                                    style={{ fontFamily: 'var(--font-family-mono)', fontSize: '13px' }}
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
                                placeholder="List all users"
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

                        {/* Tags */}
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
                                onChange={pathParams => update({ pathParams })}
                            />
                        )}
                        <QueryParamBuilder
                            params={endpoint.queryParams}
                            onChange={queryParams => update({ queryParams })}
                        />
                    </div>
                )}

                {tab === 'body' && HAS_BODY.includes(endpoint.method) && (
                    <div style={{ maxWidth: '560px' }}>
                        <RequestBodyBuilder
                            body={endpoint.requestBody}
                            onChange={requestBody => update({ requestBody })}
                        />
                    </div>
                )}

                {tab === 'responses' && (
                    <div style={{ maxWidth: '560px' }}>
                        <ResponseBuilder
                            responses={endpoint.responses}
                            onChange={responses => update({ responses })}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
```

---

## 7. Phase 3 — Schema Builder

The schema builder is the recursive core of the designer.
It handles primitive types (string, number, boolean, integer) and
complex types (object with nested fields, array of items).

### SchemaFieldBuilder.tsx

```tsx
'use client'
import { Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import type { BuilderSchemaField } from '@/lib/spec-builder/types'
import { useState } from 'react'

const TYPES = ['string', 'number', 'integer', 'boolean', 'object', 'array'] as const
const FORMATS: Record<string, string[]> = {
    string:  ['none', 'date', 'date-time', 'email', 'uuid', 'uri', 'password'],
    integer: ['none', 'int32', 'int64'],
    number:  ['none', 'float', 'double'],
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
                            {/* Expand toggle for nested types */}
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

                            {/* Field name */}
                            <input
                                type="text"
                                className="form-input"
                                value={field.name}
                                onChange={e => updateField(field.id, { name: e.target.value })}
                                placeholder="fieldName"
                                style={{ flex: 1, fontFamily: 'var(--font-family-mono)', fontSize: '12px', height: '32px' }}
                            />

                            {/* Type select */}
                            <select
                                value={field.type}
                                onChange={e => updateField(field.id, {
                                    type: e.target.value as BuilderSchemaField['type'],
                                    format: undefined,
                                    fields: e.target.value === 'object' ? [] : field.fields,
                                    items: e.target.value === 'array' ? { type: 'string', fields: [] } : null,
                                })}
                                className="form-select"
                                style={{ width: '100px', height: '32px', fontSize: '12px' }}
                            >
                                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>

                            {/* Format select — only for types that have formats */}
                            {availableFormats.length > 0 && (
                                <select
                                    value={field.format ?? 'none'}
                                    onChange={e => updateField(field.id, {
                                        format: e.target.value === 'none' ? undefined : e.target.value
                                    })}
                                    className="form-select"
                                    style={{ width: '110px', height: '32px', fontSize: '12px' }}
                                >
                                    {availableFormats.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            )}

                            {/* Required toggle */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-muted)', cursor: 'pointer', flexShrink: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={e => updateField(field.id, { required: e.target.checked })}
                                    style={{ accentColor: 'var(--color-primary)', width: '12px', height: '12px' }}
                                />
                                req
                            </label>

                            {/* Delete */}
                            <button className="btn-icon destructive" style={{ width: '24px', height: '24px', flexShrink: 0 }}
                                onClick={() => deleteField(field.id)}>
                                <Trash2 size={12} />
                            </button>
                        </div>

                        {/* Example value */}
                        <div style={{ marginLeft: '26px', marginTop: '4px' }}>
                            <input
                                type="text"
                                className="form-input"
                                value={field.example ?? ''}
                                onChange={e => updateField(field.id, { example: e.target.value || undefined })}
                                placeholder="example value (optional)"
                                style={{ fontSize: '11px', height: '26px', color: 'var(--color-text-muted)' }}
                            />
                        </div>

                        {/* Nested fields for object */}
                        {isExpanded && field.type === 'object' && (
                            <div style={{ marginTop: '8px' }}>
                                <SchemaFieldBuilder
                                    fields={field.fields ?? []}
                                    onChange={nested => updateField(field.id, { fields: nested })}
                                    depth={depth + 1}
                                />
                            </div>
                        )}

                        {/* Array items type */}
                        {isExpanded && field.type === 'array' && field.items && (
                            <div style={{ marginTop: '8px', marginLeft: '26px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                    Array item type:
                                </div>
                                <select
                                    value={field.items.type}
                                    onChange={e => updateField(field.id, {
                                        items: { ...field.items!, type: e.target.value as BuilderSchemaField['type'], fields: [] }
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
                    color: 'var(--color-text-muted)',
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
```

---

## 8. Phase 4 — Response Builder

### ResponseBuilder.tsx

Supports multiple status codes per endpoint.
Each response has a status code, description, and optional schema.

```tsx
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
            description: nextCode === '200' ? 'Success' : nextCode === '404' ? 'Not found' : '',
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
                <button className="btn-secondary" style={{ height: '28px', fontSize: '12px' }} onClick={addResponse}>
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
                        {/* Response header row */}
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
                                style={{ width: '80px', height: '28px', fontSize: '12px', fontFamily: 'var(--font-family-mono)', color: statusColor }}
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
                                style={{ flex: 1, height: '28px', fontSize: '12px' }}
                            />

                            <button
                                className="btn-icon destructive"
                                style={{ width: '24px', height: '24px', flexShrink: 0 }}
                                onClick={e => { e.stopPropagation(); deleteResponse(response.id) }}
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>

                        {/* Response body schema */}
                        {isExpanded && (
                            <div style={{ padding: '12px 16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-subtle)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
```

---

## 9. Phase 5 — YAML Preview and Export

### YamlPreviewPanel.tsx

Right panel. Monospace read-only preview. Copy + download buttons.

```tsx
'use client'
import { CopyButton } from '@/components/shared/CopyButton'
import { Download } from 'lucide-react'

type Props = {
    content: string
    format: 'YAML' | 'JSON'
    onToggleFormat: () => void
}

export function YamlPreviewPanel({ content, format, onToggleFormat }: Props) {
    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `spec.${format.toLowerCase()}`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div style={{
            width: '360px',
            flexShrink: 0,
            borderLeft: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-bg)',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid var(--color-border)',
                flexShrink: 0,
            }}>
                <button
                    onClick={onToggleFormat}
                    style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'var(--font-family-mono)',
                    }}
                >
                    {format} ↕
                </button>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <CopyButton value={content} />
                    <button className="btn-icon" onClick={handleDownload} title="Download">
                        <Download size={12} />
                    </button>
                </div>
            </div>

            <pre style={{
                flex: 1,
                overflow: 'auto',
                margin: 0,
                padding: '12px',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '11px',
                lineHeight: 1.6,
                color: 'var(--color-text-muted)',
                whiteSpace: 'pre',
            }}>
                {content}
            </pre>
        </div>
    )
}
```

---

## 10. Phase 6 — Save as Spec Version

### SaveSpecModal.tsx

Two modes: create new spec, or add version to existing spec.

```tsx
'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { specsApi } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { useRouter } from 'next/navigation'
import type { SpecDetail } from '@/lib/api-client'

type Props = {
    open: boolean
    onClose: () => void
    mode: 'new' | 'edit'
    existingSpec?: SpecDetail
    content: string
    format: 'YAML' | 'JSON'
}

export function SaveSpecModal({ open, onClose, mode, existingSpec, content, format }: Props) {
    const [specName, setSpecName] = useState(existingSpec?.name ?? '')
    const [deployAfter, setDeployAfter] = useState(true)
    const queryClient = useQueryClient()
    const router = useRouter()

    const createMutation = useMutation({
        mutationFn: () => specsApi.create({
            name: specName,
            content,
            format: format.toLowerCase() as 'yaml' | 'json',
        }),
        onSuccess: (spec) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.specs.all() })
            onClose()
            if (deployAfter) {
                router.push(`/mocks?specId=${spec.id}&specVersionId=${spec.versions[0]?.id}`)
            } else {
                router.push(`/specs/${spec.id}`)
            }
        },
    })

    const versionMutation = useMutation({
        mutationFn: () => specsApi.uploadVersion(existingSpec!.id, {
            content,
            format: format.toLowerCase() as 'yaml' | 'json',
        }),
        onSuccess: (version) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.specs.versions(existingSpec!.id) })
            onClose()
            if (deployAfter) {
                router.push(`/mocks?specId=${existingSpec!.id}&specVersionId=${version.id}`)
            } else {
                router.push(`/specs/${existingSpec!.id}`)
            }
        },
    })

    if (!open) return null

    const isPending = createMutation.isPending || versionMutation.isPending

    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '440px' }}>
                <h2 className="modal-title">
                    {mode === 'new' ? 'Save Spec' : 'Save New Version'}
                </h2>

                {mode === 'new' && (
                    <div className="form-field">
                        <label className="form-label">Spec name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={specName}
                            onChange={e => setSpecName(e.target.value)}
                            placeholder="Petstore API"
                            autoFocus
                        />
                    </div>
                )}

                {mode === 'edit' && (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        This will add a new version to <strong>{existingSpec?.name}</strong>.
                    </p>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text)', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={deployAfter}
                        onChange={e => setDeployAfter(e.target.checked)}
                        style={{ accentColor: 'var(--color-primary)' }}
                    />
                    Deploy mock server immediately after saving
                </label>

                <div className="modal-actions">
                    <button onClick={onClose} disabled={isPending} className="btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={() => mode === 'new' ? createMutation.mutate() : versionMutation.mutate()}
                        disabled={isPending || (mode === 'new' && !specName.trim())}
                        className="btn-primary"
                    >
                        {isPending ? 'Saving...' : mode === 'new' ? 'Save Spec' : 'Save Version'}
                    </button>
                </div>
            </div>
        </div>
    )
}
```

---

## 11. Phase 7 — Edit Existing Spec

### parse-spec-to-builder.ts

Parses an existing OpenAPI YAML/JSON string back into builder state.
This is the most complex piece — OpenAPI has many optional fields,
so defensive parsing is required.

```typescript
import yaml from 'yaml'
import type { BuilderState, BuilderEndpoint, BuilderSchemaField, BuilderResponse } from './types'

export function parseSpecToBuilder(content: string, format: 'YAML' | 'JSON'): BuilderState {
    const spec = format === 'YAML' ? yaml.parse(content) : JSON.parse(content)

    const info = {
        title: spec.info?.title ?? '',
        version: spec.info?.version ?? '1.0.0',
        description: spec.info?.description ?? '',
        basePath: spec.servers?.[0]?.url ?? '/api',
    }

    const endpoints: BuilderEndpoint[] = []

    for (const [path, methods] of Object.entries(spec.paths ?? {})) {
        for (const [method, operation] of Object.entries(methods as Record<string, unknown>)) {
            if (!['get','post','put','patch','delete','head','options'].includes(method)) continue
            const op = operation as Record<string, unknown>

            // Parse parameters
            const params = (op.parameters ?? []) as Array<Record<string, unknown>>
            const pathParams = params
                .filter(p => p.in === 'path')
                .map(p => ({
                    id: crypto.randomUUID(),
                    name: String(p.name ?? ''),
                    description: String(p.description ?? ''),
                    required: Boolean(p.required ?? true),
                    schema: { type: 'string' as const, fields: [] },
                }))

            const queryParams = params
                .filter(p => p.in === 'query')
                .map(p => ({
                    id: crypto.randomUUID(),
                    name: String(p.name ?? ''),
                    description: String(p.description ?? ''),
                    required: Boolean(p.required ?? false),
                    schema: { type: 'string' as const, fields: [] },
                }))

            // Parse responses
            const responses: BuilderResponse[] = Object.entries(op.responses ?? {}).map(([code, resp]) => {
                const r = resp as Record<string, unknown>
                const jsonSchema = (r.content as any)?.['application/json']?.schema
                return {
                    id: crypto.randomUUID(),
                    statusCode: code,
                    description: String(r.description ?? ''),
                    schema: jsonSchema ? parseSchemaToFields(jsonSchema) : { type: 'object' as const, fields: [] },
                }
            })

            endpoints.push({
                id: crypto.randomUUID(),
                method: method.toUpperCase() as BuilderEndpoint['method'],
                path,
                summary: String(op.summary ?? ''),
                description: String(op.description ?? ''),
                tag: (op.tags as string[] | undefined)?.[0],
                pathParams,
                queryParams,
                requestBody: null,   // TODO: parse requestBody
                responses,
            })
        }
    }

    return { info, endpoints }
}

function parseSchemaToFields(schema: Record<string, unknown>): { type: string; fields: BuilderSchemaField[] } {
    return {
        type: String(schema.type ?? 'object'),
        fields: Object.entries(schema.properties ?? {}).map(([name, prop]) => {
            const p = prop as Record<string, unknown>
            return {
                id: crypto.randomUUID(),
                name,
                type: String(p.type ?? 'string') as BuilderSchemaField['type'],
                format: p.format ? String(p.format) : undefined,
                required: false,
                description: String(p.description ?? ''),
                fields: [],
                items: null,
                example: p.example ? String(p.example) : undefined,
            }
        }),
    }
}
```

---

## 12. Shared Types

### lib/spec-builder/types.ts

```typescript
export type BuilderState = {
    info: BuilderInfo
    endpoints: BuilderEndpoint[]
}

export type BuilderInfo = {
    title: string
    version: string
    description: string
    basePath: string
}

export type BuilderEndpoint = {
    id: string
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
    path: string
    summary: string
    description: string
    tag?: string
    pathParams: BuilderParam[]
    queryParams: BuilderParam[]
    requestBody: BuilderRequestBody | null
    responses: BuilderResponse[]
}

export type BuilderParam = {
    id: string
    name: string
    description: string
    required: boolean
    schema: { type: BuilderSchemaField['type']; fields: BuilderSchemaField[] }
}

export type BuilderRequestBody = {
    required: boolean
    description: string
    schema: { type: string; fields: BuilderSchemaField[] }
}

export type BuilderResponse = {
    id: string
    statusCode: string
    description: string
    schema: { type: string; fields: BuilderSchemaField[] }
}

export type BuilderSchemaField = {
    id: string
    name: string
    type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array'
    format?: string
    required: boolean
    description: string
    example?: string
    fields: BuilderSchemaField[]    // for object type
    items: { type: string; fields: BuilderSchemaField[] } | null  // for array type
}
```

---

## 13. YAML Generation Logic

### lib/spec-builder/generate-openapi.ts

Converts builder state to a plain OpenAPI 3.0.3 object.
No YAML serialization here — just the JS object.

```typescript
import type { BuilderState, BuilderSchemaField, BuilderEndpoint } from './types'

export function generateOpenAPI(state: BuilderState): Record<string, unknown> {
    const paths: Record<string, unknown> = {}

    for (const endpoint of state.endpoints) {
        if (!paths[endpoint.path]) paths[endpoint.path] = {}

        const operation: Record<string, unknown> = {}

        if (endpoint.summary) operation.summary = endpoint.summary
        if (endpoint.description) operation.description = endpoint.description
        if (endpoint.tag) operation.tags = [endpoint.tag]

        // Parameters
        const parameters = [
            ...endpoint.pathParams.map(p => ({
                name: p.name,
                in: 'path',
                required: true,
                description: p.description || undefined,
                schema: { type: p.schema.type },
            })),
            ...endpoint.queryParams.map(p => ({
                name: p.name,
                in: 'query',
                required: p.required,
                description: p.description || undefined,
                schema: { type: p.schema.type },
            })),
        ]
        if (parameters.length > 0) operation.parameters = parameters

        // Request body
        if (endpoint.requestBody && ['POST','PUT','PATCH'].includes(endpoint.method)) {
            operation.requestBody = {
                required: endpoint.requestBody.required,
                content: {
                    'application/json': {
                        schema: buildSchema(endpoint.requestBody.schema)
                    }
                }
            }
        }

        // Responses
        const responses: Record<string, unknown> = {}
        for (const resp of endpoint.responses) {
            const responseObj: Record<string, unknown> = {
                description: resp.description || 'Response',
            }
            if (resp.schema?.fields?.length > 0) {
                responseObj.content = {
                    'application/json': {
                        schema: buildSchema(resp.schema)
                    }
                }
            }
            responses[resp.statusCode] = responseObj
        }
        operation.responses = responses

        ;(paths[endpoint.path] as Record<string, unknown>)[endpoint.method.toLowerCase()] = operation
    }

    return {
        openapi: '3.0.3',
        info: {
            title: state.info.title || 'Untitled API',
            version: state.info.version || '1.0.0',
            ...(state.info.description ? { description: state.info.description } : {}),
        },
        servers: [{ url: state.info.basePath || '/api' }],
        paths,
    }
}

function buildSchema(schema: { type: string; fields: BuilderSchemaField[] }): Record<string, unknown> {
    if (schema.type !== 'object' || schema.fields.length === 0) {
        return { type: schema.type }
    }

    const properties: Record<string, unknown> = {}
    const required: string[] = []

    for (const field of schema.fields) {
        if (!field.name) continue

        let fieldSchema: Record<string, unknown> = { type: field.type }
        if (field.format) fieldSchema.format = field.format
        if (field.description) fieldSchema.description = field.description
        if (field.example !== undefined) fieldSchema.example = field.example

        if (field.type === 'object' && field.fields.length > 0) {
            fieldSchema = buildSchema({ type: 'object', fields: field.fields })
        }

        if (field.type === 'array' && field.items) {
            fieldSchema.items = field.items.fields?.length > 0
                ? buildSchema({ type: field.items.type, fields: field.items.fields })
                : { type: field.items.type }
        }

        properties[field.name] = fieldSchema
        if (field.required) required.push(field.name)
    }

    return {
        type: 'object',
        properties,
        ...(required.length > 0 ? { required } : {}),
    }
}
```

### lib/spec-builder/serialize-spec.ts

```typescript
import yaml from 'yaml'

export function serializeSpec(spec: Record<string, unknown>, format: 'YAML' | 'JSON'): string {
    if (format === 'JSON') {
        return JSON.stringify(spec, null, 2)
    }
    return yaml.stringify(spec, { indent: 2 })
}
```

---

## 14. Implementation Checklist

```
PHASE 1 — SHELL
[ ] lib/spec-builder/types.ts created with all builder types
[ ] app/(dashboard)/specs/new/page.tsx created with PRO gate
[ ] app/(dashboard)/specs/[id]/design/page.tsx created
[ ] SpecDesignerView.tsx created — three panel layout
[ ] "Design Spec" button added to SpecsView with PRO gate
[ ] "Design in editor" option added to VersionHistoryTable

PHASE 2 — ENDPOINT BUILDER
[ ] EndpointList.tsx — method badge, path, add/delete
[ ] EndpointEditor.tsx — tabs: Details, Parameters, Body, Responses
[ ] ApiInfoForm.tsx — title, version, basePath, description
[ ] PathParamBuilder.tsx — detects params from path string, lets user describe them
[ ] QueryParamBuilder.tsx — add/remove query params with type and required flag

PHASE 3 — SCHEMA BUILDER
[ ] SchemaFieldBuilder.tsx — recursive, handles object nesting and array items
[ ] All types supported: string, number, integer, boolean, object, array
[ ] Format selector per type (date-time, email, uuid, etc.)
[ ] Required checkbox per field
[ ] Example value input per field
[ ] Expand/collapse for nested objects

PHASE 4 — RESPONSE BUILDER
[ ] ResponseBuilder.tsx — multiple responses per endpoint
[ ] Status code selector with common codes
[ ] Schema builder per response
[ ] Expand/collapse per response
[ ] Auto-suggests description based on status code

PHASE 5 — YAML PREVIEW
[ ] generate-openapi.ts converts builder state to OpenAPI object
[ ] serialize-spec.ts outputs YAML or JSON string
[ ] YamlPreviewPanel.tsx — real-time preview, copy, download
[ ] Toggle between YAML and JSON preview
[ ] Preview updates instantly as user types

PHASE 6 — SAVE
[ ] SaveSpecModal.tsx — two modes: new spec or new version
[ ] "Deploy immediately" checkbox
[ ] On save: calls existing specsApi.create or specsApi.uploadVersion
[ ] On success with deploy: navigates to /mocks with prefill params

PHASE 7 — EDIT EXISTING
[ ] parse-spec-to-builder.ts parses YAML/JSON back to BuilderState
[ ] /specs/:id/design loads latest version and parses it
[ ] Editing adds a new SpecVersion on save (non-destructive)
[ ] User sees "Editing: {spec name}" in top bar
```