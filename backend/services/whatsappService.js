const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

async function sendWhatsApp(phone, message) {
  if (!client) {
    console.warn('⚠️  Twilio not configured — skipping WhatsApp send');
    return { success: false, reason: 'Twilio not configured' };
  }

  if (!phone) {
    console.warn('⚠️  No phone number provided — skipping WhatsApp send');
    return { success: false, reason: 'No phone number' };
  }

  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    digits = '91' + digits;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits;
  } else if (digits.startsWith('0')) {
    digits = '91' + digits.slice(1);
  }
  const to = `whatsapp:+${digits}`;
  console.log("FINAL TWILIO TO:", to);

  try {
    const result = await client.messages.create({
      from: fromNumber,
      to,
      body: message,
    });
    console.log("TWILIO SID:", result.sid);
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error("TWILIO ERROR:", err.code);
    console.error("TWILIO MESSAGE:", err.message);
    return { success: false, reason: err.message };
  }
}

module.exports = { sendWhatsApp };
