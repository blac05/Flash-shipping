const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const FROM = process.env.EMAIL_FROM || 'noreply@flashshipping.com'

async function send({ to, subject, html }) {
  if (!process.env.SENDGRID_API_KEY) { console.log('[Email] SENDGRID_API_KEY not set — skipping.'); return }
  await sgMail.send({ to, from: FROM, subject, html })
}

async function sendWelcome(user) {
  await send({
    to: user.email,
    subject: '⚡ Welcome to Flash Shipping & Deliveries',
    html: `
      <div style="font-family:Inter,sans-serif;background:#0A1628;color:#fff;padding:40px;max-width:600px;margin:auto;border-radius:16px">
        <div style="font-family:Rajdhani,sans-serif;font-size:28px;font-weight:700;color:#00C6FF;margin-bottom:8px">⚡ FLASH™</div>
        <h1 style="font-size:22px;margin-bottom:16px">Welcome, ${user.fullName}!</h1>
        <p style="color:#C8D6E5;line-height:1.7">Your Flash ${user.accountType} account is ready. You can now book shipments, track packages, and manage your deliveries from anywhere in the world.</p>
        <a href="${process.env.CLIENT_URL}/dashboard" style="display:inline-block;margin-top:24px;background:linear-gradient(135deg,#1A6FD4,#00C6FF);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700">Go to Dashboard →</a>
        <p style="color:#6B7A99;font-size:12px;margin-top:32px">Flash Shipping & Deliveries™ · 500+ Harbors · 7 Continents</p>
      </div>`,
  })
}

async function sendShipmentConfirmation(user, shipment) {
  await send({
    to: user.email,
    subject: `⚡ Shipment Booked — ${shipment.trackingCode}`,
    html: `
      <div style="font-family:Inter,sans-serif;background:#0A1628;color:#fff;padding:40px;max-width:600px;margin:auto;border-radius:16px">
        <div style="font-family:Rajdhani,sans-serif;font-size:28px;font-weight:700;color:#00C6FF">⚡ FLASH™</div>
        <h1 style="font-size:20px;margin:16px 0 8px">Shipment Confirmed</h1>
        <div style="background:#112040;border-radius:12px;padding:20px;margin:16px 0">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px">
            <span style="color:#6B7A99">Tracking Code</span>
            <strong style="color:#00C6FF;font-family:monospace">${shipment.trackingCode}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px">
            <span style="color:#6B7A99">Mode</span><span>${shipment.mode.toUpperCase()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px">
            <span style="color:#6B7A99">From</span><span>${shipment.origin.address}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px">
            <span style="color:#6B7A99">To</span><span>${shipment.destination.address}</span>
          </div>
          <div style="display:flex;justify-content:space-between">
            <span style="color:#6B7A99">Total</span><strong style="color:#00C6FF">$${shipment.pricing?.total?.toFixed(2)}</strong>
          </div>
        </div>
        <a href="${process.env.CLIENT_URL}/track/${shipment.trackingCode}" style="display:inline-block;margin-top:8px;background:linear-gradient(135deg,#1A6FD4,#00C6FF);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700">Track Shipment →</a>
        <p style="color:#6B7A99;font-size:12px;margin-top:32px">Flash Shipping & Deliveries™</p>
      </div>`,
  })
}

async function sendStatusUpdate(user, shipment, status) {
  const messages = {
    picked_up:        'Your shipment has been picked up and is on its way.',
    in_transit:       'Your shipment is in transit.',
    at_hub:           'Your shipment has arrived at a distribution hub.',
    out_for_delivery: 'Your shipment is out for delivery today!',
    delivered:        'Your shipment has been delivered successfully.',
  }
  await send({
    to: user.email,
    subject: `📦 Shipment Update — ${shipment.trackingCode}`,
    html: `
      <div style="font-family:Inter,sans-serif;background:#0A1628;color:#fff;padding:40px;max-width:600px;margin:auto;border-radius:16px">
        <div style="font-family:Rajdhani,sans-serif;font-size:28px;font-weight:700;color:#00C6FF">⚡ FLASH™</div>
        <h1 style="font-size:20px;margin:16px 0 8px">Shipment Status Update</h1>
        <p style="color:#C8D6E5">${messages[status] || `Status: ${status}`}</p>
        <p style="color:#6B7A99;font-size:13px;margin-top:8px">Tracking: <strong style="color:#fff;font-family:monospace">${shipment.trackingCode}</strong></p>
        <a href="${process.env.CLIENT_URL}/track/${shipment.trackingCode}" style="display:inline-block;margin-top:20px;background:linear-gradient(135deg,#1A6FD4,#00C6FF);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700">View Details →</a>
      </div>`,
  })
}

module.exports = { sendWelcome, sendShipmentConfirmation, sendStatusUpdate }
