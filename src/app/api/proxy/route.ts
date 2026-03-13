import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import http from 'http';
import { URL } from 'url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Resolve a relative URL against a base URL
function resolveUrl(base: string, relative: string): string {
    try {
        return new URL(relative, base).href;
    } catch {
        return relative;
    }
}

// Rewrite .m3u8 playlist so all segment/key URIs go through this proxy
function rewriteM3U8(text: string, baseUrl: string, proxyBaseUrl: string): string {
    return text
        .split('\n')
        .map(line => {
            const trimmed = line.trim();

            // Rewrite URI="..." attributes (EXT-X-KEY, EXT-X-MAP, etc.)
            if (trimmed.startsWith('#')) {
                return line.replace(/URI="([^"]+)"/g, (_, uri) => {
                    const abs = resolveUrl(baseUrl, uri);
                    return `URI="${proxyBaseUrl}?url=${encodeURIComponent(abs)}"`;
                });
            }

            // Empty lines
            if (!trimmed) return line;

            // Comment lines that aren't tags
            if (trimmed.startsWith('#')) return line;

            // Segment lines (relative or absolute URL)
            const abs = resolveUrl(baseUrl, trimmed);
            return `${proxyBaseUrl}?url=${encodeURIComponent(abs)}`;
        })
        .join('\n');
}

// Fetch a URL using Node's http/https, following up to maxRedirects redirects
function fetchUrl(targetUrl: string, maxRedirects = 5): Promise<{ status: number; headers: Record<string, string>; buffer: Buffer; finalUrl: string }> {
    return new Promise((resolve, reject) => {
        function doRequest(url: string, redirectsLeft: number) {
            let parsed: URL;
            try {
                parsed = new URL(url);
            } catch (e) {
                return reject(new Error(`Invalid URL: ${url}`));
            }

            const isHttps = parsed.protocol === 'https:';
            const lib = isHttps ? https : http;

            const options = {
                hostname: parsed.hostname,
                port: parsed.port || (isHttps ? 443 : 80),
                path: parsed.pathname + parsed.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36',
                    'Accept': 'application/vnd.apple.mpegurl, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Origin': 'https://www.viu.lk',
                    'Referer': 'https://www.viu.lk/',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                },
                timeout: 20000,
                rejectUnauthorized: false,
            };

            const req = lib.request(options, (res) => {
                // Follow redirects
                if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) && res.headers.location) {
                    if (redirectsLeft <= 0) {
                        return reject(new Error('Too many redirects'));
                    }
                    const nextUrl = resolveUrl(url, res.headers.location);
                    res.resume();
                    return doRequest(nextUrl, redirectsLeft - 1);
                }

                const chunks: any[] = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    const responseHeaders: Record<string, string> = {};
                    for (const [k, v] of Object.entries(res.headers)) {
                        if (typeof v === 'string') responseHeaders[k] = v;
                        else if (Array.isArray(v)) responseHeaders[k] = v[0];
                    }
                    resolve({
                        status: res.statusCode || 200,
                        headers: responseHeaders,
                        buffer,
                        finalUrl: url,
                    });
                });
                res.on('error', reject);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timed out'));
            });
            req.on('error', reject);
            req.end();
        }

        doRequest(targetUrl, maxRedirects);
    });
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
    }

    const corsHeaders: Record<string, string> = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'no-store, max-age=0',
    };

    try {
        console.log(`[proxy] Requesting: ${targetUrl}`);
        const result = await fetchUrl(targetUrl);
        
        // Detect current proxy base URL (absolute) for rewriting
        const reqUrl = new URL(request.url);
        const proxyBaseUrl = `${reqUrl.protocol}//${reqUrl.host}${reqUrl.pathname}`;

        const contentType = result.headers['content-type'] || '';
        console.log(`[proxy] Status: ${result.status}, Content-Type: ${contentType}`);

        const isM3U8 =
            result.status >= 200 && result.status < 300 &&
            (contentType.includes('mpegurl') ||
             contentType.includes('x-mpegurl') ||
             contentType.includes('vnd.apple') ||
             targetUrl.includes('.m3u8') ||
             targetUrl.includes('.m3u') ||
             result.buffer.toString('utf8', 0, 7) === '#EXTM3U');

        if (isM3U8) {
            const text = result.buffer.toString('utf8');
            const rewritten = rewriteM3U8(text, result.finalUrl, proxyBaseUrl);
            return new NextResponse(rewritten, {
                status: result.status,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/vnd.apple.mpegurl',
                },
            });
        }

        // Return binary data (TS segments, etc)
        // Convert Buffer to Uint8Array for NextResponse compatibility in some envs
        const body = new Uint8Array(result.buffer);
        return new NextResponse(body, {
            status: result.status,
            headers: {
                ...corsHeaders,
                'Content-Type': contentType || 'video/MP2T',
                'Content-Length': String(result.buffer.length),
            },
        });

    } catch (err: any) {
        console.error(`[proxy] Proxy Error for ${targetUrl}:`, err);
        return new NextResponse(JSON.stringify({ error: err?.message || 'Proxy error', target: targetUrl }), {
            status: 502,
            headers: corsHeaders,
        });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': '*',
        },
    });
}
