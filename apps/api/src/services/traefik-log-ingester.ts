import fs from 'node:fs'
import readline from 'node:readline'
import { db } from '@mockline/db'
import { bulkCreateRequestLogs } from '../repositories/sandbox-log.repository'

/**
 * Traefik Access Log Ingester
 *
 * Traefik writes one JSON object per line to /var/log/traefik/access.log.
 * This service runs on a cron (every 2 minutes), reads new lines since the
 * last run using a byte-offset cursor, matches each entry's RequestHost to
 * a running mock server's publicUrl, and bulk-inserts into SandboxRequestLog.
 *
 * Cursor is stored in memory (resets on restart — safe, just re-reads recent
 * lines). For production durability, persist cursor to a file or Redis.
 *
 * Traefik JSON log fields used:
 *   RequestHost      — hostname, e.g. "stripe-api-a7b2.mockline.xyz"
 *   RequestMethod    — "GET", "POST", etc.
 *   RequestPath      — "/users", "/transactions/123"
 *   DownstreamStatus — HTTP status code returned to client
 *   Duration         — request duration in nanoseconds
 *   request_User-Agent — caller's user-agent
 *   ClientHost       — caller's IP address
 *   time             — ISO timestamp of the request
 */

// Byte offset of the last line we processed — persists across cron ticks
let logCursor = 0

const LOG_PATH = process.env.TRAEFIK_ACCESS_LOG_PATH ?? '/var/log/traefik/access.log'

// In-memory cache of publicUrl hostname → mockServerId
// Refreshed on each ingestion run to pick up newly provisioned mocks
let hostToMockId: Map<string, string> | null = null

async function refreshHostMap(): Promise<Map<string, string>> {
    const mocks = await db.mockServer.findMany({
        where: { deletedAt: null, publicUrl: { not: null } },
        select: { id: true, publicUrl: true },
    })

    const map = new Map<string, string>()
    for (const mock of mocks) {
        if (!mock.publicUrl) continue
        try {
            const host = new URL(mock.publicUrl).hostname
            map.set(host, mock.id)
        } catch {
            // malformed publicUrl — skip
        }
    }
    return map
}

// Shape of a Traefik JSON access log line
interface TraefikLogEntry {
    RequestHost?: string
    RequestMethod?: string
    RequestPath?: string
    DownstreamStatus?: number
    Duration?: number                  // nanoseconds
    'request_User-Agent'?: string
    ClientHost?: string
    time?: string                      // ISO 8601
    RouterName?: string                // e.g. "mock-abc123@docker"
}

export async function ingestTraefikAccessLogs(): Promise<{ ingested: number; skipped: number }> {
    if (!fs.existsSync(LOG_PATH)) {
        // Log file doesn't exist yet — Traefik hasn't received any traffic
        return { ingested: 0, skipped: 0 }
    }

    const stat = fs.statSync(LOG_PATH)

    // File was rotated or truncated — reset cursor
    if (stat.size < logCursor) {
        logCursor = 0
    }

    // Nothing new since last run
    if (stat.size === logCursor) {
        return { ingested: 0, skipped: 0 }
    }

    // Refresh host → mockId map on every run
    hostToMockId = await refreshHostMap()

    const entries: Parameters<typeof bulkCreateRequestLogs>[0] = []
    let skipped = 0

    await new Promise<void>((resolve, reject) => {
        const stream = fs.createReadStream(LOG_PATH, {
            start: logCursor,
            encoding: 'utf8',
        })

        const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

        rl.on('line', (line) => {
            const trimmed = line.trim()
            if (!trimmed) return

            let entry: TraefikLogEntry
            try {
                entry = JSON.parse(trimmed)
            } catch {
                skipped++
                return
            }

            const host = entry.RequestHost
            if (!host) { skipped++; return }

            const mockServerId = hostToMockId!.get(host)
            if (!mockServerId) {
                // Traffic to api.mockline.xyz or other non-mock routes — ignore
                skipped++
                return
            }

            const method = entry.RequestMethod ?? 'GET'
            const reqPath = entry.RequestPath ?? '/'
            const statusCode = entry.DownstreamStatus ?? 0
            // Traefik Duration is in nanoseconds — convert to ms
            const responseTimeMs = entry.Duration ? Math.round(entry.Duration / 1_000_000) : undefined
            const userAgent = entry['request_User-Agent'] ?? undefined
            const ipAddress = entry.ClientHost ?? undefined
            const createdAt = entry.time ? new Date(entry.time) : undefined

            entries.push({
                mockServerId,
                method,
                path: reqPath,
                statusCode,
                responseTimeMs,
                userAgent,
                ipAddress,
                createdAt,
            })
        })

        rl.on('close', resolve)
        rl.on('error', reject)
        stream.on('error', reject)
    })

    // Advance cursor to end of file
    logCursor = stat.size

    if (entries.length === 0) {
        return { ingested: 0, skipped }
    }

    // Bulk insert — createMany is a single INSERT ... VALUES (...)
    await bulkCreateRequestLogs(entries)

    return { ingested: entries.length, skipped }
}
