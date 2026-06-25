const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client = null;
if (accountSid && authToken && !accountSid.startsWith('ACxxxx')) {
  client = twilio(accountSid, authToken);
} else {
  console.warn('⚠️ Twilio placeholders detected. Communication pipelines operating in sandbox mock mode.');
}

module.exports = {
  client,
  phone: process.env.TWILIO_PHONE || '+1234567890'
};