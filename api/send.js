export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email } = req.body;

    // Validate email
    if (!email || !email.includes('@') || !email.includes('.')) {
        return res.status(400).json({ message: 'Invalid email address' });
    }

    try {
        // Gunakan API yang sudah terbukti berhasil di bot WhatsApp
        const upstreamUrl = process.env.UPSTREAM_SEND_URL || 'https://znn-alightmotion.vercel.app/api/send';
        
        console.log('Sending request to:', upstreamUrl);
        console.log('Email:', email);

        const response = await fetch(upstreamUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', data);

        if (!response.ok) {
            return res.status(response.status).json({
                message: data.message || data.msg || 'Request failed'
            });
        }

        return res.status(200).json({
            message: data.message || data.msg || 'Magic link sent successfully',
            email: email,
            ...data
        });

    } catch (error) {
        console.error('Send endpoint error:', error.message);
        return res.status(502).json({
            message: 'Service temporarily unavailable: ' + error.message
        });
    }
}
