const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const functions = require('firebase-functions');
const { callNextClientHandler, markAttendingHandler, markAbsentHandler, markFinishedHandler, reactivateClientHandler } = require('./transitions');
const { setEventStatusHandler } = require('./eventToggle');
const { sendRegistrationConfirmation } = require('./notifications');

const app = initializeApp();
const db = getDatabase(app);

const twilioSecrets = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'USE_WHATSAPP'];

function wrap(handler, secrets = []) {
  const opts = secrets.length > 0 ? { secrets } : {};
  return functions.runWith(opts).https.onCall(async (data) => {
    try {
      return await handler(data);
    } catch (err) {
      // Re-throw as v1 HttpsError so the framework serializes it correctly
      const validCodes = ['cancelled','unknown','invalid-argument','deadline-exceeded','not-found','already-exists','permission-denied','resource-exhausted','failed-precondition','aborted','out-of-range','unimplemented','internal','unavailable','data-loss','unauthenticated'];
      const code = validCodes.includes(err.code) ? err.code : 'internal';
      throw new functions.https.HttpsError(code, err.message);
    }
  });
}

exports.callNextClient = wrap(async (data) => {
  const { eventId, chairNumber } = data;
  return callNextClientHandler(db, eventId, chairNumber);
}, twilioSecrets);

exports.markAttending = wrap(async (data) => {
  const { eventId, clientId } = data;
  return markAttendingHandler(db, eventId, clientId);
});

exports.markAbsent = wrap(async (data) => {
  const { eventId, clientId, chairNumber } = data;
  return markAbsentHandler(db, eventId, clientId, chairNumber);
});

exports.markFinished = wrap(async (data) => {
  const { eventId, clientId, chairNumber } = data;
  return markFinishedHandler(db, eventId, clientId, chairNumber);
});

exports.sendRegistrationConfirmation = wrap(async (data) => {
  const { eventId, clientId } = data;
  const snap = await db.ref(`queue/${eventId}/${clientId}`).get();
  const client = snap.val();
  if (!client) throw new functions.https.HttpsError('not-found', 'Cliente no encontrado');
  await sendRegistrationConfirmation(db, eventId, clientId, client);
  return { success: true };
}, twilioSecrets);

exports.setEventStatus = wrap(async (data) => {
  const { eventId, newStatus } = data;
  return setEventStatusHandler(db, eventId, newStatus);
});

exports.reactivateClient = wrap(async (data) => {
  const { eventId, clientId } = data;
  return reactivateClientHandler(db, eventId, clientId);
}, twilioSecrets);
