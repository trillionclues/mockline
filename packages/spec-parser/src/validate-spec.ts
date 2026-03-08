import type { SpecValidationResult } from '@mockline/types'

// Validates OpenAPI spec string and returns structured validation results.
// Uses @readme/openapi-parser under the hood.
export async function validateSpec(
    content: string,
    format: 'yaml' | 'json' = 'yaml',
): Promise<SpecValidationResult> {
    // TODO: Implement OpenAPI validation using @readme/openapi-parser
    // 1. Parse content (YAML → object or JSON.parse)
    // 2. Validate against OpenAPI 3.x schema
    // 3. Extract info (title, version, description)
    // 4. Parse + return endpoints
    throw new Error('Not implemented')
}
