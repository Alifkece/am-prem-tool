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
    // Gunakan upstream URL dari environment variable atau fallback ke URL yang sudah dikenal
    const upstreamUrl = process.env.UPSTREAM_SEND_URL || 'https://znn-alightmotion.vercel.app/api/send';
    const apiKey = process.env.UPSTREAM_API_KEY;

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Forward request to upstream API
    const response = await fetch(upstreamUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    // Return response to client
    if (!response.ok) {
      return res.status(response.status).json({
        message: data.message || data.msg || 'Request to upstream service failed'
      });
    }

    return res.status(200).json({
      message: data.message || data.msg || 'Magic link sent successfully',
      ...data
    });

  } catch (error) {
    console.error('Send endpoint error:', error.message);
    return res.status(502).json({
      message: 'Service temporarily unavailable'
    });
  }
}
