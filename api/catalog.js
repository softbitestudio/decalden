const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(503).json({ error: 'Catalog is not configured.' });

  try {
    const url = `${SUPABASE_URL}/rest/v1/decal_inventory?select=id,material_id,name,description,icon,price_per_sq_in,has_color,special_order,colors&active=eq.true&order=sort_order.asc,name.asc`;
    const response = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    if (!response.ok) throw new Error(`Supabase catalog returned ${response.status}`);
    const rows = await response.json();
    return res.status(200).json({ items: rows });
  } catch (error) {
    console.error('Catalog error:', error.message);
    return res.status(502).json({ error: 'Unable to load the catalog.' });
  }
};
