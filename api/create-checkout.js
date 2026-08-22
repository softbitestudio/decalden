const Stripe = require('stripe');

const ALLOWED_VINYLS = {
  glossy: 10,
  matte: 15,
  chrome: 25,
  holographic: 20,
  'holographic-black': 25,
  glow: 25,
  hologlow: 40,
  'reflective-white': 40,
  'reflective-black': 40,
};
const SHAPE_MULTIPLIERS = { contour: 1, square: 0.92, circle: 0.96, rounded: 0.94 };
const SHIPPING = {
  free_us: { label: 'Domestic (USA)', amount: 0, countries: ['US'] },
  track_us: { label: 'Domestic + Tracking', amount: 500, countries: ['US'] },
  free_intl: { label: 'International', amount: 0, countries: ['CA', 'GB', 'AU', 'NZ', 'MX'] },
  track_intl: { label: 'International + Tracking', amount: 1000, countries: ['CA', 'GB', 'AU', 'NZ', 'MX'] },
};

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
}
function fail(res, message) { return res.status(400).json({ error: message }); }

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe is not configured.' });

  let input;
  try { input = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); } catch { return fail(res, 'Invalid request body.'); }

  const vinyl = String(input.vinyl || '');
  const shape = String(input.shape || 'contour');
  const shipping = String(input.shipping || 'free_us');
  const width = Number(input.width);
  const height = Number(input.height);
  const quantity = Number(input.quantity);
  const color = String(input.color || '').slice(0, 40);
  const artworkName = String(input.artworkName || 'uploaded artwork').slice(0, 100);
  const email = String(input.email || '').trim().slice(0, 320);

  if (!(vinyl in ALLOWED_VINYLS) || !(shape in SHAPE_MULTIPLIERS) || !(shipping in SHIPPING)) return fail(res, 'Invalid order selection.');
  if (!Number.isFinite(width) || width < 1 || width > 8.5 || !Number.isFinite(height) || height < 1 || height > 12) return fail(res, 'Invalid decal dimensions.');
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 8) return fail(res, 'Invalid quantity.');

  const area = width * height;
  const setup = 350;
  const unit = Math.max(setup, Math.round(setup + area * ALLOWED_VINYLS[vinyl] * SHAPE_MULTIPLIERS[shape]));
  const discount = 0.02;
  const subtotal = Math.round(unit * (1 - discount)) * quantity;
  const shippingChoice = SHIPPING[shipping];
  const total = subtotal + shippingChoice.amount;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      ...(email ? { customer_email: email } : {}),
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: total,
          product_data: {
            name: `Custom Decal · ${width}\" × ${height}\" · ×${quantity}`,
            description: `${vinyl} vinyl, ${shape} cut${color ? `, ${color}` : ''}`,
          },
        },
      }],
      shipping_address_collection: { allowed_countries: shippingChoice.countries },
      phone_number_collection: { enabled: true },
      billing_address_collection: 'auto',
      consent_collection: { terms_of_service: 'required' },
      custom_text: {
        submit: { message: 'Your decal is custom-made from the artwork you provide.' },
      },
      metadata: {
        artwork_name: artworkName,
        vinyl,
        shape,
        shipping,
        width: String(width),
        height: String(height),
        quantity: String(quantity),
        color,
        subtotal: String(subtotal),
        shipping_amount: String(shippingChoice.amount),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://DecalDen.xyz'}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://DecalDen.xyz'}/?checkout=cancelled`,
    });
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe Checkout session error:', error.message);
    return res.status(502).json({ error: 'Unable to start checkout.' });
  }
};