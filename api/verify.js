const crypto = require('crypto');

const CONFIG = {
    BASE_URL: process.env.ALIGHTPRO_BASE_URL || 'https://www.alightpro.my.id',
    SECRET: process.env.ALIGHTPRO_SECRET || 'amprem-human-v3-secret-2026',
    UA: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
    TIMEOUT: 45000
};

const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');

async function getSession() {
    const res = await fetch(`${CONFIG.BASE_URL}/api/session`, {
        signal: AbortSignal.timeout(CONFIG.TIMEOUT),
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-store',
            'User-Agent': CONFIG.UA,
            'Origin': CONFIG.BASE_URL,
            'Referer': CONFIG.BASE_URL + '/',
            'Accept': 'application/json'
        }
    });
    if (!res.ok) throw new Error(`Session endpoint HTTP ${res.status}`);
    const setCookie = res.headers.get('set-cookie') || '';
    const cookie = setCookie.split(';')[0];
    const data = await res.json();
    if (!data.status || !data.token || !data.nonce) {
        throw new Error('Session token/nonce tidak valid dari server');
    }
    return { ...data, cookie };
}

function solvePow({ sessionId, nonce, timestamp, email, action, humanProof, difficulty }) {
    const base = `${sessionId}:${nonce}:${timestamp}:${email.toLowerCase()}:${action}:${humanProof}:`;
    for (let i = 0; i < 500000; i++) {
        if (sha256(base + i).startsWith(difficulty)) return String(i);
    }
    return Date.now().toString();
}

async function callAlight(body) {
    const s = await getSession();
    const delay = 2300 - (Date.now() - parseInt(s.timestamp, 10));
    if (delay > 0) await new Promise(r => setTimeout(r, delay));

    const humanProof = sha256(
        `human:${s.sessionId}:${s.nonce}:${s.timestamp}:${body.email.toLowerCase()}:5:${CONFIG.SECRET}`
    );
    const pow = solvePow({ ...s, email: body.email, action: body.action, humanProof });

    const res = await fetch(`${CONFIG.BASE_URL}/api/alight-motion`, {
        method: 'POST',
        signal: AbortSignal.timeout(CONFIG.TIMEOUT),
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Amprem-Token': s.token,
            'X-Amprem-Nonce': s.nonce,
            'X-Amprem-Pow': pow,
            'X-Amprem-Human-Proof': humanProof,
            'Cookie': s.cookie,
            'User-Agent': CONFIG.UA,
            'Origin': CONFIG.BASE_URL,
            'Referer': CONFIG.BASE_URL + '/',
            'Accept': 'application/json'
        },
        body: JSON.stringify(body)
    });

    let data = null;
    const text = await res.text();
    try { data = JSON.parse(text); } catch { data = { success: false, error: 'non-json ' + res.status }; }
    return { http: res.status, data };
}

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, link } = req.body;

    // Validate inputs
    if (!email || !email.includes('@') || !email.includes('.')) {
        return res.status(400).json({ message: 'Invalid email address' });
    }

    if (!link || link.length < 10) {
        return res.status(400).json({ message: 'Invalid verification link' });
    }

    try {
        const result = await callAlight({ action: 'verify', email, link: link.trim() });
        
        if (!result.data.status || !result.data.data) {
            return res.status(400).json({
                message: result.data.msg || `HTTP ${result.http}`
            });
        }

        const premium = result.data.data.premium && result.data.data.premium.result;
        
        return res.status(200).json({
            message: result.data.msg || 'Premium activated!',
            email: email,
            accountLinkStatus: premium && premium.accountLinkStatus,
            expiryTimeMillis: premium && premium.expiryTimeMillis,
            autoRenewing: premium && premium.autoRenewing,
            data: result.data.data
        });

    } catch (error) {
        console.error('Verify endpoint error:', error.message);
        return res.status(502).json({
            message: 'Service temporarily unavailable: ' + error.message
        });
    }
}
