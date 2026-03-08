import * as OpenAPIParser from '@readme/openapi-parser'
import yaml from 'yaml'
import type { SpecValidationResult, SpecValidationError } from '@mockline/types'
import { parseEndpoints } from './parse-endpoints'

// Validates OpenAPI spec string and returns structured validation results.
export async function validateSpec(
    content: string,
    format: 'yaml' | 'json' = 'yaml',
): Promise<SpecValidationResult> {
    const errors: SpecValidationError[] = []

    let specObject: Record<string, unknown>
    try {
        specObject = format === 'yaml' ? yaml.parse(content) : JSON.parse(content)
    } catch (e) {
        return {
            valid: false,
            errors: [{ path: 'root', message: `Failed to parse ${format}: ${(e as Error).message}` }],
            endpoints: [],
        }
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await OpenAPIParser.validate(JSON.parse(JSON.stringify(specObject)) as any)
    } catch (e) {
        const err = e as Error & { details?: Array<{ path: string[]; message: string }> }
        if (err.details) {
            for (const detail of err.details) {
                errors.push({ path: detail.path.join('.'), message: detail.message })
            }
        } else {
            errors.push({ path: 'root', message: err.message })
        }
        return { valid: false, errors, endpoints: [] }
    }

    const endpoints = parseEndpoints(specObject)
    const info = specObject.info as { title?: string; version?: string; description?: string } | undefined

    return {
        valid: true,
        errors: [],
        endpoints,
        info: info
            ? {
                title: info.title ?? 'Untitled',
                version: info.version ?? '0.0.0',
                description: info.description,
            }
            : undefined,
    }
}
