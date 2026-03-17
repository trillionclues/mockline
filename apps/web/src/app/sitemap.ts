import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://mockline.xyz'

    const routes = [
        '',
        '/pricing',
        '/roadmap',
        '/about',
        '/docs',
        '/privacy',
        '/terms',
        '/login',
    ]

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '/changelog' ? 'weekly' : 'monthly',
        priority: route === '' ? 1 : route === '/pricing' ? 0.9 : 0.7,
    }))
}
