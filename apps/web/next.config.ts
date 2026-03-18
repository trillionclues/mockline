/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@mockline/types', '@mockline/spec-parser'],
    experimental: {
        serverComponentsExternalPackages: ['@prisma/client', '@mockline/db'],
    },
}

export default nextConfig
