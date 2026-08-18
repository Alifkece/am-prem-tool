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
        // Gunakan API yang sudah terbukti berhasil di bot WhatsApp
        const upstreamUrl = process.env.UPSTREAM_VERIFY_URL || 'https://znn-alightmotion.vercel.app/api/verify';
        
        console.log('Verifying with:', upstreamUrl);
        console.log('Email:', email);
        console.log('Link:', link.substring(0, 50) + '...');

        const response = await fetch(upstreamUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({ email, link }),
        });

        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', data);

        if (!response.ok) {
            return res.status(response.status).json({
                message: data.message || data.msg || 'Verification failed'
            });
        }

        return res.status(200).json({
            message: data.message || data.msg || 'Verification successful',
            email: email,
            ...data
        });

    } catch (error) {
        console.error('Verify endpoint error:', error.message);
        return res.status(502).json({
            message: 'Service temporarily unavailable: ' + error.message
        });
    }
}
