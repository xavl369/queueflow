const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { callNextClientHandler, markAttendingHandler, markAbsentHandler, markFinishedHandler, reactivateClientHandler } = require('./transitions');
const { setEventStatusHandler } = require('./eventToggle');
const { sendRegistrationConfirmation } = require('./notifications');

const app = initializeApp();
const db = getDatabase(app);

function wrap(handler) {
  return onCall(async (request) => {
    try {
      return await handler(request);
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      throw new HttpsError('internal', err.message);
    }
  });
}

exports.callNextClient = wrap(async (request) => {
  const { eventId, chairNumber } = request.data;
  return callNextClientHandler(db, eventId, chairNumber);
});

exports.markAttending = wrap(async (request) => {
  const { eventId, clientId, chairNumber } = request.data;
  return markAttendingHandler(db, eventId, clientId, chairNumber);
});

exports.markAbsent = wrap(async (request) => {
  const { eventId, clientId, chairNumber } = request.data;
  return markAbsentHandler(db, eventId, clientId, chairNumber);
});

exports.markFinished = wrap(async (request) => {
  const { eventId, clientId, chairNumber } = request.data;
  return markFinishedHandler(db, eventId, clientId, chairNumber);
});

exports.sendRegistrationConfirmation = wrap(async (request) => {
  const { eventId, clientId } = request.data;
  const snap = await db.ref(`queue/${eventId}/${clientId}`).get();
  const client = snap.val();
  if (!client) throw new HttpsError('not-found', 'Cliente no encontrado');
  await sendRegistrationConfirmation(db, eventId, clientId, client);
  return { success: true };
});

exports.setEventStatus = wrap(async (request) => {
  const { eventId, newStatus } = request.data;
  return setEventStatusHandler(db, eventId, newStatus);
});

exports.reactivateClient = wrap(async (request) => {
  const { eventId, clientId } = request.data;
  return reactivateClientHandler(db, eventId, clientId);
});
