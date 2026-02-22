import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        const urlObj = new URL(url);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Referer': `${urlObj.protocol}//${urlObj.host}/`,
                'Origin': `${urlObj.protocol}//${urlObj.host}`,
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        if (!response.ok) {
            return new NextResponse(`Proxy error: ${response.status}`, { status: response.status });
        }

        const data = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/vnd.apple.mpegurl';

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (error) {
        console.error('Proxy Error:', error);
        return new NextResponse('Internal Proxy Error', { status: 500 });
    }
}
