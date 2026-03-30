/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@mockline/types', '@mockline/spec-parser'],
    serverExternalPackages: ['@prisma/client', '@mockline/db'],
    allowedDevOrigins: ['127.0.0.1', 'localhost', 'mockline.xyz'],
    // remove dev
    devIndicators: false,
}

export default nextConfig
