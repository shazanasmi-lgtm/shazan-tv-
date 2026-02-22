import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    const requestOrigin = new URL(request.url).origin;
    const proxyPath = '/api/proxy?url=';
    const baseUrl = requestOrigin + proxyPath;

    try {
        const targetUrl = new URL(url);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Referer': targetUrl.origin + '/',
                'Origin': targetUrl.origin,
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'cross-site',
                // Forward spoofing headers if present
                ...(request.headers.get('x-online-host') ? { 'X-Online-Host': request.headers.get('x-online-host') || '' } : {}),
                ...(request.headers.get('x-forwarded-host') ? { 'X-Forwarded-Host': request.headers.get('x-forwarded-host') || '' } : {}),
            },
            next: { revalidate: 0 } // Disable cache for live streams
        });

        if (!response.ok) {
            return new NextResponse(`Target Error: ${response.status}`, { status: response.status });
        }

        const contentType = response.headers.get('content-type') || '';

        // Smarter M3U8 detection
        const isLikelyM3U8 = contentType.includes('mpegurl') ||
            contentType.includes('application/x-mpegURL') ||
            url.includes('.m3u8') ||
            contentType.includes('text/plain');

        if (isLikelyM3U8) {
            let text = await response.text();

            // Verify and clean
            if (!text.startsWith('#EXTM3U') && !contentType.includes('mpegurl')) {
                // Not a real manifest or a weird data stream
                return new NextResponse(Buffer.from(text), {
                    headers: { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' }
                });
            }

            const lines = text.split('\n');
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                // Skip tags, empty lines, and already proxied links
                if (!trimmed || trimmed.startsWith('#') || trimmed.includes(proxyPath)) return line;

                try {
                    const resolvedUrl = new URL(trimmed, url).href;
                    return `${baseUrl}${encodeURIComponent(resolvedUrl)}`;
                } catch (e) {
                    return line;
                }
            });

            return new NextResponse(rewrittenLines.join('\n'), {
                status: 200,
                headers: {
                    'Content-Type': 'application/vnd.apple.mpegurl',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                },
            });
        }

        // Segments or images
        const buffer = await response.arrayBuffer();
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Proxy Fatal Error:', error);
        return new NextResponse('Proxy failed', { status: 500 });
    }
}
