const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(503).json({ error: 'Catalog is not configured.' });

  try {
    const base = `${SUPABASE_URL}/rest/v1/decalden_colors?select=id,name,slug,hex,finish,in_stock,sort_order&in_stock=eq.true&order=sort_order.asc,name.asc`;
    const response = await fetch(base, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    if (!response.ok) throw new Error(`Supabase catalog returned ${response.status}`);
    const colors = await response.json();
    const byFinish = new Map();
    for (const color of colors) {
      const finish = String(color.finish || '').toLowerCase();
      if (!['glossy', 'matte'].includes(finish)) continue;
      if (!byFinish.has(finish)) byFinish.set(finish, []);
      byFinish.get(finish).push(color.hex);
    }
    const items = [
      { id: 'glossy', name: 'Glossy Color', description: 'Vivid, smooth, weatherproof', icon: 'droplet', price_per_sq_in: 0.10, has_color: true, special_order: false, colors: byFinish.get('glossy') || [] },
      { id: 'matte', name: 'Matte Color', description: 'Flat, no-glare finish', icon: 'square', price_per_sq_in: 0.15, has_color: true, special_order: false, colors: byFinish.get('matte') || [] },
      { id: 'chrome', name: 'Metallic Chrome', description: 'Mirror-like metallic finish', icon: 'gem', price_per_sq_in: 0.25, has_color: true, special_order: false, colors: ['#B8BCC2', '#A98D18'] },
      { id: 'holographic', name: 'Holographic', description: 'Rainbow-shift finish · special order', icon: 'sparkles', price_per_sq_in: 0.20, has_color: false, special_order: true, colors: ['#B98CFF'] },
      { id: 'holographic-black', name: 'Holographic Black', description: 'Black holo finish · special order', icon: 'sparkles', price_per_sq_in: 0.25, has_color: false, special_order: true, colors: ['#17131d'] },
      { id: 'glow', name: 'Glow-in-the-Dark', description: 'Charges in light · special order', icon: 'moon-star', price_per_sq_in: 0.25, has_color: false, special_order: true, colors: ['#C7F9CC'] },
      { id: 'hologlow', name: 'Holo/Glow', description: 'Holographic + glow · special order', icon: 'sparkles', price_per_sq_in: 0.40, has_color: false, special_order: true, colors: ['#C7F9CC'] },
      { id: 'reflective-white', name: 'Reflective White', description: 'Reflective white · special order', icon: 'flashlight', price_per_sq_in: 0.40, has_color: false, special_order: true, colors: ['#FAFAFA'] },
      { id: 'reflective-black', name: 'Reflective Black', description: 'Reflective black · special order', icon: 'flashlight', price_per_sq_in: 0.40, has_color: false, special_order: true, colors: ['#111111'] },
    ].filter(item => item.special_order || !item.has_color || item.colors.length);
    return res.status(200).json({ items });
  } catch (error) {
    console.error('Catalog error:', error.message);
    return res.status(502).json({ error: 'Unable to load the catalog.' });
  }
};
