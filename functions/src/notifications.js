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

async function sendChairReady(db, eventId, clientId, client, chairNumber) {
  const message = `¡Hola ${client.name}! 💫 Tu Silla ${chairNumber} en Glitter Bar está lista. Tienes 3 minutos para presentarte. ¡Te esperamos! ✨`;
  try {
    await sendMessage(client.phone, message);
    await db.ref(`logs/${eventId}/messages/${clientId}`).update({
      chair_ready_sent_at: Date.now(),
      status: 'delivered',
    });
  } catch (err) {
    console.error(`Twilio failed for client ${clientId}:`, err.message);
    await db.ref(`logs/${eventId}/messages/${clientId}`).update({
      chair_ready_sent_at: Date.now(),
      status: 'failed',
      error: err.message,
    });
  }
}

async function sendRegistrationConfirmation(db, eventId, clientId, client) {
  const message = `¡Hola ${client.name}! 🌟 Tu registro en Glitter Bar fue confirmado. Eres el número ${client.turn_number} en la fila. ¡Te avisaremos cuando tu silla esté lista! ✨`;
  try {
    await sendMessage(client.phone, message);
    await db.ref(`logs/${eventId}/messages/${clientId}`).update({
      registration_sent_at: Date.now(),
      status: 'delivered',
    });
  } catch (err) {
    console.error(`Registration confirmation failed for client ${clientId}:`, err.message);
    await db.ref(`logs/${eventId}/messages/${clientId}`).update({
      registration_sent_at: Date.now(),
      status: 'failed',
      error: err.message,
    });
  }
}

async function sendReactivation(db, eventId, clientId, client) {
  const message = `¡Hola ${client.name}! ⭐ Has sido reactivado en la fila de Glitter Bar. ¡Te esperamos pronto! ✨`;
  try {
    await sendMessage(client.phone, message);
    await db.ref(`logs/${eventId}/messages/${clientId}`).update({
      reactivation_sent_at: Date.now(),
      status: 'delivered',
    });
  } catch (err) {
    console.error(`Reactivation notification failed for client ${clientId}:`, err.message);
    await db.ref(`logs/${eventId}/messages/${clientId}`).update({
      reactivation_sent_at: Date.now(),
      status: 'failed',
      error: err.message,
    });
  }
}

async function sendFarewell(db, eventId, clientId, client) {
  const message = `✨ Gracias por brillar con nosotros ${client.name}. Te invitamos a etiquetarnos y compartir en redes sociales:\n\n📸 Instagram: https://www.instagram.com/glitterbarhmoofficial/\n📘 Facebook: https://www.facebook.com/profile.php?id=61579532096684\n▶️ YouTube: https://www.youtube.com/@GlitterBarHmoOfficial`;
  try {
    await sendMessage(client.phone, message);
    await db.ref(`logs/${eventId}/messages/${clientId}`).update({
      farewell_sent_at: Date.now(),
      status: 'delivered',
    });
  } catch (err) {
    console.error(`Farewell notification failed for client ${clientId}:`, err.message);
    await db.ref(`logs/${eventId}/messages/${clientId}`).update({
      farewell_sent_at: Date.now(),
      status: 'failed',
      error: err.message,
    });
  }
}

module.exports = { formatPhone, sendMessage, sendChairReady, sendRegistrationConfirmation, sendReactivation, sendFarewell };
