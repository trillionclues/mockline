import { ContractResult } from "@/types";


export function EndpointResultRow({ result }: { result: ContractResult }) {
    return (
        <div style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="contract-result-row">
                <span className={`method-badge method-${result.method.toLowerCase()}`}>
                    {result.method}
                </span>
                <span className="result-path mono">{result.path}</span>
                <span style={{ fontSize: '12px', color: result.match ? 'var(--color-status-running)' : 'var(--color-status-failed)', flexShrink: 0 }}>
                    {result.match ? '✓' : '✗'}
                </span>
            </div>
            {!result.match && (
                <div style={{ padding: '0 16px 10px 16px' }}>
                    <div className="result-detail mono">
                        Expected {result.expectedStatus}, got {result.receivedStatus}
                        {result.detail ? ` — ${result.detail}` : ''}
                    </div>
                </div>
            )}
        </div>
    )
}