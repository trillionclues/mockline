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
    const [previewOpen, setPreviewOpen] = useState(false)

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
        <div className="spec-designer-root">
            <div className="spec-designer-topbar">
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
                    <button className="btn-secondary spec-designer-preview-toggle"
                        style={{ height: '32px', fontSize: '12px' }}
                        onClick={() => setPreviewOpen(v => !v)}>
                        {previewOpen ? 'Hide Preview' : 'Preview'}
                    </button>
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

            <div className="spec-designer-panels">
                <div className="spec-designer-sidebar">
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

                <div className="spec-designer-center">
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

                <div className={`spec-designer-preview ${previewOpen ? 'spec-designer-preview--mobile-open' : ''}`}>
                    <YamlPreviewPanel
                        content={previewContent}
                        format={previewFormat}
                        onToggleFormat={() => setPreviewFormat(f => f === 'YAML' ? 'JSON' : 'YAML')}
                        onClose={() => setPreviewOpen(false)}
                    />
                </div>
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
