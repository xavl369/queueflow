const { getTwilioClient } = require('./twilio');

function formatPhone(phone, countryCode = '+52') {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `${countryCode}${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return `+${digits}`;
  throw new Error(`Invalid phone number: ${phone}`);
}

async function sendMessage(phone, message) {
  const useWhatsApp = process.env.USE_WHATSAPP === 'true';
  const formattedPhone = formatPhone(phone);
  const from = process.env.TWILIO_PHONE_NUMBER;

  const messageParams = {
    body: message,
    from: useWhatsApp ? `whatsapp:${from}` : from,
    to: useWhatsApp ? `whatsapp:${formattedPhone}` : formattedPhone,
  };

  return getTwilioClient().messages.create(messageParams);
}

module.exports = { formatPhone, sendMessage };
