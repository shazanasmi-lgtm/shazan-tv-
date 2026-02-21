"use strict";

/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // Ignore TypeScript build errors so Vercel can deploy
        ignoreBuildErrors: true,
    },
    eslint: {
        // Ignore ESLint errors during build
        ignoreDuringBuilds: true,
    },
    async rewrites() {
        return [
            {
                source: '/stream/:path*',
                destination: 'https://:path*',
            },
        ];
    },
};

module.exports = nextConfig;
