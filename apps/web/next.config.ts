/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@mockline/types', '@mockline/spec-parser'],
}

export default nextConfig
