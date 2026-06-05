/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@mockline/types', '@mockline/spec-parser'],
    serverExternalPackages: ['@prisma/client', '@mockline/db'],
    allowedDevOrigins: ['127.0.0.1', 'localhost', 'mockline.xyz'],
    devIndicators: false,
    async rewrites() {
        return [
            {
                source: '/webhooks/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/webhooks/:path*`,
            },
        ]
    },
}

export default nextConfig
