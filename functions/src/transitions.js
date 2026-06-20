const { ref, get, update, runTransaction } = require('firebase-admin/database');
const { HttpsError } = require('firebase-functions/v2/https');
const { validateTransition } = require('./stateMachine');

async function callNextClientHandler(db, eventId, chairNumber) {
  const eventSnap = await get(ref(db, `events/${eventId}`));
  const event = eventSnap.val();
  if (!event || event.status !== 'active') {
    throw new HttpsError('failed-precondition', 'El evento no está activo');
  }

  const queueSnap = await get(ref(db, `queue/${eventId}`));
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
  const chairRef = ref(db, `events/${eventId}/chairs/${chairNumber}`);
  const result = await runTransaction(chairRef, (chair) => {
    if (chair && chair.status === 'occupied') return;
    return { status: 'occupied', current_client_id: nextClient.id };
  });

  if (!result.committed) {
    throw new HttpsError('failed-precondition', 'La silla ya está ocupada');
  }

  validateTransition(nextClient.status, 'called');
  await update(ref(db, `queue/${eventId}/${nextClient.id}`), {
    status: 'called',
    'timestamps/called_at': Date.now(),
  });

  return { clientId: nextClient.id };
}

async function markAttendingHandler(db, eventId, clientId, chairNumber) {
  const snap = await get(ref(db, `queue/${eventId}/${clientId}`));
  const client = snap.val();
  if (!client) throw new HttpsError('not-found', 'Cliente no encontrado');

  validateTransition(client.status, 'attending');
  await update(ref(db, `queue/${eventId}/${clientId}`), {
    status: 'attending',
    'timestamps/attending_at': Date.now(),
  });

  return { success: true };
}

async function markAbsentHandler(db, eventId, clientId, chairNumber) {
  const snap = await get(ref(db, `queue/${eventId}/${clientId}`));
  const client = snap.val();
  if (!client) throw new HttpsError('not-found', 'Cliente no encontrado');

  validateTransition(client.status, 'absent');

  const updates = {
    [`queue/${eventId}/${clientId}/status`]: 'absent',
    [`queue/${eventId}/${clientId}/timestamps/absent_at`]: Date.now(),
    [`events/${eventId}/chairs/${chairNumber}/status`]: 'available',
    [`events/${eventId}/chairs/${chairNumber}/current_client_id`]: null,
  };
  await update(ref(db), updates);

  return { success: true };
}

async function markFinishedHandler(db, eventId, clientId, chairNumber) {
  const snap = await get(ref(db, `queue/${eventId}/${clientId}`));
  const client = snap.val();
  if (!client) throw new HttpsError('not-found', 'Cliente no encontrado');

  validateTransition(client.status, 'finished');

  const updates = {
    [`queue/${eventId}/${clientId}/status`]: 'finished',
    [`queue/${eventId}/${clientId}/timestamps/finished_at`]: Date.now(),
    [`events/${eventId}/chairs/${chairNumber}/status`]: 'available',
    [`events/${eventId}/chairs/${chairNumber}/current_client_id`]: null,
  };
  await update(ref(db), updates);

  return { success: true };
}

module.exports = { callNextClientHandler, markAttendingHandler, markAbsentHandler, markFinishedHandler };
