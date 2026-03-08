import { parseEndpoints } from '@mockline/spec-parser'
import { detectFormat } from '@mockline/spec-parser'
import yaml from 'yaml'

type DiffChange = {
    type: 'added' | 'removed' | 'changed'
    path: string
    method?: string
    detail: string
    breaking: boolean
}

type SchemaDiffResult = {
    changes: DiffChange[]
    breakingCount: number
    addedCount: number
    removedCount: number
    changedCount: number
}

// Compares two spec versions and returns a diff of changes.
export function diffSpecs(oldContent: string, newContent: string): SchemaDiffResult {
    const oldFormat = detectFormat(oldContent)
    const newFormat = detectFormat(newContent)

    const oldObj = oldFormat === 'YAML' ? yaml.parse(oldContent) : JSON.parse(oldContent)
    const newObj = newFormat === 'YAML' ? yaml.parse(newContent) : JSON.parse(newContent)

    const oldEndpoints = parseEndpoints(oldObj)
    const newEndpoints = parseEndpoints(newObj)

    const changes: DiffChange[] = []

    // Index endpoints by method + path
    const oldMap = new Map(oldEndpoints.map((e) => [`${e.method} ${e.path}`, e]))
    const newMap = new Map(newEndpoints.map((e) => [`${e.method} ${e.path}`, e]))

    // Removed endpoints (breaking)
    for (const [key] of oldMap) {
        if (!newMap.has(key)) {
            const [method, path] = key.split(' ', 2)
            changes.push({
                type: 'removed',
                path: path!,
                method,
                detail: `Endpoint ${key} was removed`,
                breaking: true,
            })
        }
    }

    // Added endpoints (non-breaking)
    for (const [key] of newMap) {
        if (!oldMap.has(key)) {
            const [method, path] = key.split(' ', 2)
            changes.push({
                type: 'added',
                path: path!,
                method,
                detail: `Endpoint ${key} was added`,
                breaking: false,
            })
        }
    }

    // Changed endpoints
    for (const [key, oldEndpoint] of oldMap) {
        const newEndpoint = newMap.get(key)
        if (!newEndpoint) continue

        // Check for parameter changes
        const oldParams = new Set(oldEndpoint.parameters?.map((p) => p.name) ?? [])
        const newParams = new Set(newEndpoint.parameters?.map((p) => p.name) ?? [])

        for (const param of oldParams) {
            if (!newParams.has(param)) {
                const [method, path] = key.split(' ', 2)
                changes.push({
                    type: 'changed',
                    path: path!,
                    method,
                    detail: `Required parameter "${param}" was removed`,
                    breaking: true,
                })
            }
        }

        for (const param of newParams) {
            if (!oldParams.has(param)) {
                const [method, path] = key.split(' ', 2)
                changes.push({
                    type: 'changed',
                    path: path!,
                    method,
                    detail: `Parameter "${param}" was added`,
                    breaking: false,
                })
            }
        }
    }

    return {
        changes,
        breakingCount: changes.filter((c) => c.breaking).length,
        addedCount: changes.filter((c) => c.type === 'added').length,
        removedCount: changes.filter((c) => c.type === 'removed').length,
        changedCount: changes.filter((c) => c.type === 'changed').length,
    }
}
