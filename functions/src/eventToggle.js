const { HttpsError } = require('firebase-functions/v2/https');
const { validateEventTransition } = require('./stateMachine');

async function setEventStatusHandler(db, eventId, newStatus) {
  const snap = await db.ref(`events/${eventId}`).get();
  const event = snap.val();
  if (!event) throw new HttpsError('not-found', 'Evento no encontrado');

  validateEventTransition(event.status, newStatus);

  await db.ref(`events/${eventId}`).update({
    status: newStatus,
    updated_at: Date.now(),
  });

  return { success: true };
}

module.exports = { setEventStatusHandler };
