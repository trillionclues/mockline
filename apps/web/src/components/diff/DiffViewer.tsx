import { DiffEntry, SchemaDiff } from "@/types"

export function DiffViewer({ diff }: { diff: SchemaDiff }) {
    const hasBreaking = diff.breaking.length > 0
    const hasNonBreaking = diff.nonBreaking.length > 0

    if (!hasBreaking && !hasNonBreaking) {
        return (
            <div style={{ padding: '24px', color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                No differences between these versions.
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {hasBreaking && (
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <h3 className="section-title" style={{ marginBottom: 0, color: 'var(--color-status-failed)' }}>
                            Breaking changes
                        </h3>
                        <span style={{ fontSize: '11px', padding: '2px 6px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-status-failed)', borderRadius: '4px' }}>
                            {diff.breaking.length}
                        </span>
                    </div>
                    {diff.breaking.map((entry, i) => <DiffEntryRow key={i} entry={entry} />)}
                </section>
            )}

            {hasNonBreaking && (
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <h3 className="section-title" style={{ marginBottom: 0 }}>Non-breaking changes</h3>
                        <span style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', borderRadius: '4px' }}>
                            {diff.nonBreaking.length}
                        </span>
                    </div>
                    {diff.nonBreaking.map((entry, i) => <DiffEntryRow key={i} entry={entry} />)}
                </section>
            )}
        </div>
    )
}

function DiffEntryRow({ entry }: { entry: DiffEntry }) {
    const config = {
        added: { prefix: '+', color: 'var(--color-status-running)' },
        removed: { prefix: '-', color: 'var(--color-status-failed)' },
        changed: { prefix: '~', color: 'var(--color-status-building)' },
    }[entry.type]

    return (
        <div style={{
            display: 'flex',
            gap: '12px',
            padding: '10px 14px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            marginBottom: '4px',
        }}>
            <span style={{ color: config.color, fontWeight: 700, fontFamily: 'var(--font-family-mono)', flexShrink: 0 }}>
                {config.prefix}
            </span>
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '13px', color: 'var(--color-text-strong)', flex: 1 }}>
                {entry.path}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {entry.description}
            </span>
        </div>
    )
}