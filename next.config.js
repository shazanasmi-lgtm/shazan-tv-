"use strict";

/** @type {import('next').NextConfig} */
const nextConfig = {
    // We specify these to handle potential streaming CORS issues or proxying if needed later
    async rewrites() {
        return [
            {
                source: '/stream/:path*',
                destination: 'https://:path*', // Placeholder for potential proxying logic
            },
        ];
    },
};

module.exports = nextConfig;
