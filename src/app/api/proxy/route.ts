import { NextRequest, NextResponse } from 'next/server';

// THE ONLY HOST - Hardcoded to Dialog Viu for maximum reliability
const DIALOG_FREE_HOST = 'viu.lk';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    const requestOrigin = new URL(request.url).origin;
    const proxyPath = '/api/proxy?url=';
    const baseUrl = requestOrigin + proxyPath;

    try {
        const targetUrl = new URL(url);

        // STRICTOR HEADERS - Mimicking official Dialog Viu App explicitly
        const fetchHeaders: Record<string, string> = {
            'User-Agent': 'Viu/1.0.0 (Android 12; Mobile)',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': `https://${DIALOG_FREE_HOST}/`,
            'Origin': `https://${DIALOG_FREE_HOST}`,
            'X-Requested-With': 'com.dialog.viu',
            'X-Online-Host': DIALOG_FREE_HOST,
            'X-Forwarded-Host': DIALOG_FREE_HOST,
            'Host-Override': DIALOG_FREE_HOST,
            'Proxy-Connection': 'keep-alive',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        };

        const response = await fetch(url, {
            headers: fetchHeaders,
            next: { revalidate: 0 },
            redirect: 'follow'
        });

        if (!response.ok) {
            return new NextResponse(`Stream Error Area: ${response.status}`, { status: response.status });
        }

        const contentType = response.headers.get('content-type') || '';

        // Handle Playlists (.m3u8, .m3u)
        const isPlaylist =
            contentType.includes('mpegurl') ||
            contentType.includes('application/x-mpegURL') ||
            url.includes('.m3u8') ||
            url.includes('.m3u') ||
            contentType.includes('text/plain');

        if (isPlaylist) {
            let text = await response.text();

            if (!text.startsWith('#EXTM3U') && !contentType.includes('mpegurl')) {
                return new NextResponse(Buffer.from(text), {
                    headers: { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' }
                });
            }

            // REWRITE ALL URLs TO GO THROUGH PROXY
            const lines = text.split('\n');
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#') || trimmed.includes(proxyPath)) return line;

                try {
                    const resolvedUrl = new URL(trimmed, url).href;
                    // Automatically append mandatory proxy routing for every chunk
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
                    'X-ZD-Active': 'AUTO'
                },
            });
        }

        // Handle Media Segments
        const buffer = await response.arrayBuffer();
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=60',
            },
        });
    } catch (error) {
        console.error('Fatal Proxy Error:', error);
        return new NextResponse('Connection failed', { status: 500 });
    }
}
