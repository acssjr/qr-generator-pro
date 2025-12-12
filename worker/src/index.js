/**
 * QR Code Tracker Worker
 * Cloudflare Worker para rastreamento de QR Codes
 */

// Gerar ID curto único
function generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] % chars.length];
    }
    return result;
}

// Gerar UUID
function generateUUID() {
    return crypto.randomUUID();
}

// Hash do IP para privacidade
async function hashIP(ip) {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + 'qr-tracker-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Detectar tipo de dispositivo
function getDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
        if (/ipad|tablet/i.test(ua)) return 'tablet';
        return 'mobile';
    }
    return 'desktop';
}

// Detectar navegador
function getBrowser(userAgent) {
    if (!userAgent) return 'unknown';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('SamsungBrowser')) return 'Samsung Browser';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    return 'other';
}

// Detectar SO
function getOS(userAgent) {
    if (!userAgent) return 'unknown';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'other';
}

// Headers CORS
function corsHeaders(origin, env) {
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || [];
    const isAllowed = allowedOrigins.some(o => origin?.includes(o.trim())) || origin?.includes('localhost');

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0] || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
}

// Resposta JSON
function jsonResponse(data, status = 200, origin, env) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin, env)
        }
    });
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;
        const origin = request.headers.get('Origin');

        // Handle CORS preflight
        if (method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders(origin, env)
            });
        }

        try {
            // POST /api/links - Criar novo link rastreável
            if (path === '/api/links' && method === 'POST') {
                const body = await request.json();
                const { url: originalUrl, title } = body;

                if (!originalUrl) {
                    return jsonResponse({ error: 'URL é obrigatória' }, 400, origin, env);
                }

                const id = generateUUID();
                const shortCode = generateShortCode();

                await env.DB.prepare(
                    'INSERT INTO links (id, short_code, original_url, title) VALUES (?, ?, ?, ?)'
                ).bind(id, shortCode, originalUrl, title || null).run();

                const trackingUrl = `${url.origin}/t/${shortCode}`;

                return jsonResponse({
                    success: true,
                    data: {
                        id,
                        shortCode,
                        originalUrl,
                        trackingUrl,
                        title
                    }
                }, 201, origin, env);
            }

            // GET /api/links - Listar todos os links
            if (path === '/api/links' && method === 'GET') {
                const { results } = await env.DB.prepare(`
                    SELECT l.*, 
                           COUNT(c.id) as total_clicks,
                           MAX(c.clicked_at) as last_click
                    FROM links l
                    LEFT JOIN clicks c ON l.id = c.link_id
                    WHERE l.is_active = 1
                    GROUP BY l.id
                    ORDER BY l.created_at DESC
                `).all();

                return jsonResponse({
                    success: true,
                    data: results.map(link => ({
                        ...link,
                        trackingUrl: `${url.origin}/t/${link.short_code}`
                    }))
                }, 200, origin, env);
            }

            // GET /api/links/:id - Detalhes de um link
            if (path.match(/^\/api\/links\/[\w-]+$/) && method === 'GET') {
                const linkId = path.split('/').pop();

                const link = await env.DB.prepare(
                    'SELECT * FROM links WHERE id = ? OR short_code = ?'
                ).bind(linkId, linkId).first();

                if (!link) {
                    return jsonResponse({ error: 'Link não encontrado' }, 404, origin, env);
                }

                return jsonResponse({
                    success: true,
                    data: {
                        ...link,
                        trackingUrl: `${url.origin}/t/${link.short_code}`
                    }
                }, 200, origin, env);
            }

            // DELETE /api/links/:id - Desativar link
            if (path.match(/^\/api\/links\/[\w-]+$/) && method === 'DELETE') {
                const linkId = path.split('/').pop();

                await env.DB.prepare(
                    'UPDATE links SET is_active = 0 WHERE id = ? OR short_code = ?'
                ).bind(linkId, linkId).run();

                return jsonResponse({ success: true }, 200, origin, env);
            }

            // GET /api/stats/:id - Estatísticas de um link
            if (path.match(/^\/api\/stats\/[\w-]+$/) && method === 'GET') {
                const linkId = path.split('/').pop();

                // Buscar link
                const link = await env.DB.prepare(
                    'SELECT * FROM links WHERE id = ? OR short_code = ?'
                ).bind(linkId, linkId).first();

                if (!link) {
                    return jsonResponse({ error: 'Link não encontrado' }, 404, origin, env);
                }

                // Total de cliques
                const totalClicks = await env.DB.prepare(
                    'SELECT COUNT(*) as count FROM clicks WHERE link_id = ?'
                ).bind(link.id).first();

                // Unique scans (por ip_hash único)
                const uniqueScans = await env.DB.prepare(
                    'SELECT COUNT(DISTINCT ip_hash) as count FROM clicks WHERE link_id = ?'
                ).bind(link.id).first();

                // Primeiro e último scan
                const scanRange = await env.DB.prepare(`
                    SELECT MIN(clicked_at) as first_scan, MAX(clicked_at) as last_scan
                    FROM clicks WHERE link_id = ?
                `).bind(link.id).first();

                // Cliques por dia (últimos 30 dias)
                const clicksByDay = await env.DB.prepare(`
                    SELECT DATE(clicked_at) as date, COUNT(*) as count
                    FROM clicks 
                    WHERE link_id = ? AND clicked_at >= datetime('now', '-30 days')
                    GROUP BY DATE(clicked_at)
                    ORDER BY date DESC
                `).bind(link.id).all();

                // Cliques por hora do dia
                const clicksByHour = await env.DB.prepare(`
                    SELECT strftime('%H', clicked_at) as hour, COUNT(*) as count
                    FROM clicks 
                    WHERE link_id = ?
                    GROUP BY strftime('%H', clicked_at)
                    ORDER BY hour
                `).bind(link.id).all();

                // Cliques por país
                const clicksByCountry = await env.DB.prepare(`
                    SELECT country, COUNT(*) as count
                    FROM clicks 
                    WHERE link_id = ?
                    GROUP BY country
                    ORDER BY count DESC
                    LIMIT 10
                `).bind(link.id).all();

                // Top cidades
                const clicksByCity = await env.DB.prepare(`
                    SELECT city, country, COUNT(*) as count
                    FROM clicks 
                    WHERE link_id = ? AND city != 'unknown'
                    GROUP BY city, country
                    ORDER BY count DESC
                    LIMIT 10
                `).bind(link.id).all();

                // Cliques por dispositivo
                const clicksByDevice = await env.DB.prepare(`
                    SELECT device_type, COUNT(*) as count
                    FROM clicks 
                    WHERE link_id = ?
                    GROUP BY device_type
                `).bind(link.id).all();

                // Cliques por navegador
                const clicksByBrowser = await env.DB.prepare(`
                    SELECT browser, COUNT(*) as count
                    FROM clicks 
                    WHERE link_id = ?
                    GROUP BY browser
                    ORDER BY count DESC
                `).bind(link.id).all();

                // Cliques por SO
                const clicksByOS = await env.DB.prepare(`
                    SELECT os, COUNT(*) as count
                    FROM clicks 
                    WHERE link_id = ?
                    GROUP BY os
                    ORDER BY count DESC
                `).bind(link.id).all();

                // Últimos cliques
                const recentClicks = await env.DB.prepare(`
                    SELECT clicked_at, country, city, device_type, browser, os
                    FROM clicks 
                    WHERE link_id = ?
                    ORDER BY clicked_at DESC
                    LIMIT 20
                `).bind(link.id).all();

                // Scans hoje vs ontem (tendência)
                const todayScans = await env.DB.prepare(`
                    SELECT COUNT(*) as count FROM clicks 
                    WHERE link_id = ? AND DATE(clicked_at) = DATE('now')
                `).bind(link.id).first();

                const yesterdayScans = await env.DB.prepare(`
                    SELECT COUNT(*) as count FROM clicks 
                    WHERE link_id = ? AND DATE(clicked_at) = DATE('now', '-1 day')
                `).bind(link.id).first();

                return jsonResponse({
                    success: true,
                    data: {
                        link: {
                            ...link,
                            trackingUrl: `${url.origin}/t/${link.short_code}`
                        },
                        stats: {
                            totalClicks: totalClicks.count,
                            uniqueScans: uniqueScans.count,
                            firstScan: scanRange.first_scan,
                            lastScan: scanRange.last_scan,
                            todayScans: todayScans.count,
                            yesterdayScans: yesterdayScans.count,
                            clicksByDay: clicksByDay.results,
                            clicksByHour: clicksByHour.results,
                            clicksByCountry: clicksByCountry.results,
                            clicksByCity: clicksByCity.results,
                            clicksByDevice: clicksByDevice.results,
                            clicksByBrowser: clicksByBrowser.results,
                            clicksByOS: clicksByOS.results,
                            recentClicks: recentClicks.results
                        }
                    }
                }, 200, origin, env);
            }

            // GET /t/:shortCode - Redirecionar e registrar clique
            if (path.match(/^\/t\/[\w]+$/) && method === 'GET') {
                const shortCode = path.split('/').pop();

                const link = await env.DB.prepare(
                    'SELECT * FROM links WHERE short_code = ? AND is_active = 1'
                ).bind(shortCode).first();

                if (!link) {
                    return new Response('Link não encontrado', { status: 404 });
                }

                // Coletar informações do clique
                const userAgent = request.headers.get('User-Agent') || '';
                const ip = request.headers.get('CF-Connecting-IP') || '';
                const country = request.cf?.country || 'unknown';
                const city = request.cf?.city || 'unknown';
                const region = request.cf?.region || 'unknown';
                const referer = request.headers.get('Referer') || '';

                const ipHash = await hashIP(ip);
                const deviceType = getDeviceType(userAgent);
                const browser = getBrowser(userAgent);
                const os = getOS(userAgent);

                // Registrar clique de forma assíncrona (não bloqueia o redirect)
                ctx.waitUntil(
                    env.DB.prepare(`
                        INSERT INTO clicks (link_id, ip_hash, country, city, region, device_type, browser, os, user_agent, referer)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(link.id, ipHash, country, city, region, deviceType, browser, os, userAgent, referer).run()
                );

                // Redirecionar para URL original
                return Response.redirect(link.original_url, 302);
            }

            // Health check
            if (path === '/health') {
                return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() }, 200, origin, env);
            }

            // Rota não encontrada
            return jsonResponse({ error: 'Rota não encontrada' }, 404, origin, env);

        } catch (error) {
            console.error('Error:', error);
            return jsonResponse({ error: 'Erro interno do servidor', details: error.message }, 500, origin, env);
        }
    }
};
