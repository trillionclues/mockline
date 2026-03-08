const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type FetchOptions = {
    method?: string
    body?: unknown
    headers?: Record<string, string>
}

// fetch wrapper for the Mockline API.
// handles JSON serialization and error parsing.
export async function apiClient<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    })

    const json = (await res.json()) as { data: T; error: { message: string } | null }

    if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? `Request failed: ${res.status}`)
    }

    return json.data
}
