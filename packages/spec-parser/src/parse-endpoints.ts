import type { ParsedEndpoint } from '@mockline/types'

// Extracts endpoint defs from parsed OpenAPI spec object.
export function parseEndpoints(_specObject: Record<string, unknown>): ParsedEndpoint[] {
    // TODO: Walk the paths object and extract method/path/parameters/responses
    throw new Error('Not implemented')
}
