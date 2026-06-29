const { HttpsError } = require('firebase-functions/v2/https');
const { validateTransition } = require('./stateMachine');
const { sendChairReady, sendReactivation, sendFarewell } = require('./notifications');

async function callNextClientHandler(db, eventId, chairNumber) {
  const eventSnap = await db.ref(`events/${eventId}`).get();
  const event = eventSnap.val();
  if (!event || event.status !== 'active') {
    throw new HttpsError('failed-precondition', 'El evento no está activo');
  }

  const queueSnap = await db.ref(`queue/${eventId}`).get();
  const queueData = queueSnap.val() || {};
  const waitingClients = Object.entries(queueData)
    .map(([id, c]) => ({ id, ...c }))
    .filter(c => c.status === 'waiting')
    .sort((a, b) => {
      if (Boolean(a.priority) !== Boolean(b.priority)) return a.priority ? -1 : 1;
      return a.turn_number - b.turn_number;
    });

  if (waitingClients.length === 0) {
    throw new HttpsError('failed-precondition', 'No hay clientes en espera');
  }

  const nextClient = waitingClients[0];
  const result = await db.ref(`events/${eventId}/chairs/${chairNumber}`).transaction((chair) => {
    if (chair && chair.status === 'occupied') return;
    return { status: 'occupied', current_client_id: nextClient.id };
  });

  if (!result.committed) {
    throw new HttpsError('failed-precondition', 'La silla ya está ocupada');
  }

  validateTransition(nextClient.status, 'called');
  await db.ref(`queue/${eventId}/${nextClient.id}`).update({
    status: 'called',
    'timestamps/called_at': Date.now(),
  });

  await sendChairReady(db, eventId, nextClient.id, nextClient, chairNumber);

  return { clientId: nextClient.id };
}

async function markAttendingHandler(db, eventId, clientId) {
  const snap = await db.ref(`queue/${eventId}/${clientId}`).get();
  const client = snap.val();
  if (!client) throw new HttpsError('not-found', 'Cliente no encontrado');

  validateTransition(client.status, 'attending');
  await db.ref(`queue/${eventId}/${clientId}`).update({
    status: 'attending',
    'timestamps/attending_at': Date.now(),
  });

  return { success: true };
}

async function markAbsentHandler(db, eventId, clientId, chairNumber) {
  const snap = await db.ref(`queue/${eventId}/${clientId}`).get();
  const client = snap.val();
  if (!client) throw new HttpsError('not-found', 'Cliente no encontrado');

  validateTransition(client.status, 'absent');
  await db.ref('/').update({
    [`queue/${eventId}/${clientId}/status`]: 'absent',
    [`queue/${eventId}/${clientId}/timestamps/absent_at`]: Date.now(),
    [`events/${eventId}/chairs/${chairNumber}/status`]: 'available',
    [`events/${eventId}/chairs/${chairNumber}/current_client_id`]: null,
  });

  return { success: true };
}

async function markFinishedHandler(db, eventId, clientId, chairNumber) {
  const snap = await db.ref(`queue/${eventId}/${clientId}`).get();
  const client = snap.val();
  if (!client) throw new HttpsError('not-found', 'Cliente no encontrado');

  validateTransition(client.status, 'finished');
  await db.ref('/').update({
    [`queue/${eventId}/${clientId}/status`]: 'finished',
    [`queue/${eventId}/${clientId}/timestamps/finished_at`]: Date.now(),
    [`events/${eventId}/chairs/${chairNumber}/status`]: 'available',
    [`events/${eventId}/chairs/${chairNumber}/current_client_id`]: null,
  });

  await sendFarewell(db, eventId, clientId, client);

  return { success: true };
}

async function reactivateClientHandler(db, eventId, clientId) {
  const snap = await db.ref(`queue/${eventId}/${clientId}`).get();
  const client = snap.val();
  if (!client) throw new HttpsError('not-found', 'Cliente no encontrado');

  validateTransition(client.status, 'waiting');
  await db.ref(`queue/${eventId}/${clientId}`).update({
    status: 'waiting',
    priority: true,
    'timestamps/reactivated_at': Date.now(),
  });

  await sendReactivation(db, eventId, clientId, client);

  return { success: true };
}

module.exports = { callNextClientHandler, markAttendingHandler, markAbsentHandler, markFinishedHandler, reactivateClientHandler };
