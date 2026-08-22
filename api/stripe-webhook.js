module.exports.config = { api: { bodyParser: false } };

const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(500).send('Stripe webhook is not configured.');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers['stripe-signature'];
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error.message);
    return res.status(400).send('Invalid signature.');
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    console.log(JSON.stringify({
      event: stripeEvent.type,
      sessionId: session.id,
      paymentStatus: session.payment_status,
      order: session.metadata || {},
    }));
    // TODO: persist fulfillment/order state in Supabase before shipping production orders.
  }

  return res.status(200).json({ received: true });
};