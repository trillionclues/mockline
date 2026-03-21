'use client'
import type { BuilderInfo } from '@/lib/spec-builder/types'

type Props = {
    info: BuilderInfo
    onChange: (info: BuilderInfo) => void
}

export function ApiInfoForm({ info, onChange }: Props) {
    const update = (partial: Partial<BuilderInfo>) =>
        onChange({ ...info, ...partial })

    return (
        <div style={{
            padding: '12px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flexShrink: 0,
        }}>
            <span style={{
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--color-text)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
            }}>
                API Info
            </span>

            <div className="form-field">
                <input
                    type="text"
                    className="form-input"
                    value={info.title}
                    onChange={e => update({ title: e.target.value })}
                    placeholder="API title *"
                    style={{ fontSize: '12px', height: '32px' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
                <input
                    type="text"
                    className="form-input"
                    value={info.version}
                    onChange={e => update({ version: e.target.value })}
                    placeholder="1.0.0"
                    style={{ fontSize: '12px', height: '32px', width: '70px', flexShrink: 0 }}
                />
                <input
                    type="text"
                    className="form-input"
                    value={info.basePath}
                    onChange={e => update({ basePath: e.target.value })}
                    placeholder="/api"
                    style={{ fontSize: '12px', height: '32px', flex: 1, }}
                />
            </div>

            <textarea
                className="form-textarea"
                value={info.description}
                onChange={e => update({ description: e.target.value })}
                placeholder="API description (optional)"
                rows={2}
                style={{ fontSize: '12px', resize: 'vertical' }}
            />
        </div>
    )
}
