const EMAILOCTOPUS_API_KEY = process.env.EMAILOCTOPUS_API_KEY;
const EMAILOCTOPUS_LIST_ID = process.env.EMAILOCTOPUS_LIST_ID || 'b08d1246-d2f4-11f0-a3ac-97246f683cef';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!EMAILOCTOPUS_API_KEY) return res.status(503).json({ error: 'Signup is not configured.' });

  let input;
  try { input = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); } catch { return res.status(400).json({ error: 'Invalid request.' }); }
  const email = String(input.email || '').trim().toLowerCase();
  if (!/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(email) || email.length > 320) return res.status(400).json({ error: 'Please use a valid email address.' });

  try {
    const response = await fetch(`https://emailoctopus.com/api/1.6/lists/${encodeURIComponent(EMAILOCTOPUS_LIST_ID)}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: EMAILOCTOPUS_API_KEY, email_address: email, status: 'SUBSCRIBED' }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok && !(response.status === 400 && /already exists|already subscribed/i.test(JSON.stringify(body)))) {
      console.error('EmailOctopus signup failed:', response.status, body.message || body.error_code || 'unknown error');
      return res.status(502).json({ error: 'Could not join Fluff Coven right now.' });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('EmailOctopus request failed:', error.message);
    return res.status(502).json({ error: 'Could not join Fluff Coven right now.' });
  }
};