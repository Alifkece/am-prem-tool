const crypto = require('crypto');

const CONFIG = {
    BASE_URL: process.env.ALIGHTPRO_BASE_URL || 'https://www.alightpro.my.id',
    SECRET: process.env.ALIGHTPRO_SECRET || 'amprem-human-v3-secret-2026',
    UA: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    TIMEOUT: 60000
};

const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');

function getBrowserHeaders() {
    const uaList = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    const ua = uaList[Math.floor(Math.random() * uaList.length)];
    const secChUa = `"Not_A Brand";v="8", "Chromium";v="${ua.match(/Chrome\/(\d+)/)[1]}", "Google Chrome";v="${ua.match(/Chrome\/(\d+)/)[1]}"`;
    
    return {
        'User-Agent': ua,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Ch-Ua': secChUa,
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest'
    };
}

async function getSession() {
    const headers = getBrowserHeaders();
    
    try {
        const res = await fetch(`${CONFIG.BASE_URL}/api/session`, {
            signal: AbortSignal.timeout(CONFIG.TIMEOUT),
            headers: {
                ...headers,
                'Origin': CONFIG.BASE_URL,
                'Referer': CONFIG.BASE_URL + '/'
            }
        });
        
        if (!res.ok) {
            console.error(`Session HTTP ${res.status}`);
            throw new Error(`Session endpoint HTTP ${res.status}`);
        }
        
        const setCookie = res.headers.get('set-cookie') || '';
        const cookie = setCookie.split(';')[0];
        const data = await res.json();
        
        if (!data.status || !data.token || !data.nonce) {
            throw new Error('Session token/nonce tidak valid dari server');
        }
        return { ...data, cookie };
    } catch (err) {
        console.error('Session error:', err.message);
        throw new Error('Failed to get session: ' + err.message);
    }
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
    if (delay > 0 && delay < 5000) {
        await new Promise(r => setTimeout(r, delay + Math.random() * 1000));
    }

    const humanProof = sha256(
        `human:${s.sessionId}:${s.nonce}:${s.timestamp}:${body.email.toLowerCase()}:5:${CONFIG.SECRET}`
    );
    const pow = solvePow({ ...s, email: body.email, action: body.action, humanProof });

    const headers = getBrowserHeaders();
    
    const res = await fetch(`${CONFIG.BASE_URL}/api/alight-motion`, {
        method: 'POST',
        signal: AbortSignal.timeout(CONFIG.TIMEOUT),
        headers: {
            ...headers,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Amprem-Token': s.token,
            'X-Amprem-Nonce': s.nonce,
            'X-Amprem-Pow': pow,
            'X-Amprem-Human-Proof': humanProof,
            'Cookie': s.cookie,
            'Origin': CONFIG.BASE_URL,
            'Referer': CONFIG.BASE_URL + '/'
        },
        body: JSON.stringify(body)
    });

    let data = null;
    const text = await res.text();
    try { data = JSON.parse(text); } catch { 
        data = { success: false, error: 'non-json ' + res.status };
        console.error('Response text:', text.substring(0, 200));
    }
    return { http: res.status, data };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, link } = req.body;

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
                message: result.data.msg || result.data.error || `HTTP ${result.http}`
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
