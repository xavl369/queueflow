const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { callNextClientHandler, markAttendingHandler, markAbsentHandler, markFinishedHandler } = require('./transitions');

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

// TODO(phase-5): sendRegistrationConfirmation — MSG 1
// TODO(phase-6): setEventStatus — inactive -> active -> closed
// TODO(phase-7): reactivateClient — absent -> waiting (priority: true)
