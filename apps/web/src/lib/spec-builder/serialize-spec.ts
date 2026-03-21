import yaml from 'yaml'

export function serializeSpec(spec: Record<string, unknown>, format: 'YAML' | 'JSON'): string {
    if (format === 'JSON') {
        return JSON.stringify(spec, null, 2)
    }
    return yaml.stringify(spec, { indent: 2 })
}
