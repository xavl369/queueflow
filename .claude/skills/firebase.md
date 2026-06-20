# Skill: Firebase — Glitter Bar Rules

## Database: Always Realtime Database, Never Firestore
This project uses **Firebase Realtime Database**, not Firestore.
- Import from `firebase/database`, not `firebase/firestore`
- Use `ref()`, `set()`, `update()`, `onValue()`, `push()`
- Never use `collection()`, `doc()`, `getDocs()`, `onSnapshot()`

## Real-Time Listeners — Always Clean Up
Every `onValue()` listener in a React component MUST be cleaned up on unmount.

```js
// CORRECT
useEffect(() => {
  const queueRef = ref(db, `queue/${eventId}`);
  const unsubscribe = onValue(queueRef, (snapshot) => {
    setClients(snapshot.val());
  });
  return () => unsubscribe(); // always clean up
}, [eventId]);

// WRONG — memory leak, fires after unmount
useEffect(() => {
  onValue(ref(db, `queue/${eventId}`), (snapshot) => {
    setClients(snapshot.val());
  });
}, [eventId]);
```

## Chair Assignment — ALWAYS a Cloud Function Transaction
The rule: **a chair can only have ONE client in `called` or `attending` state at a time.**

This check MUST use a Firebase transaction inside a Cloud Function.
NEVER enforce this only in the React UI — a double-tap or slow connection will break it.

```js
// CORRECT — Cloud Function with transaction
exports.callNextClient = onCall(async (request) => {
  const { eventId, chairNumber } = request.data;
  const chairRef = ref(db, `events/${eventId}/chairs/${chairNumber}`);

  const result = await runTransaction(chairRef, (chair) => {
    if (chair && chair.status === 'occupied') {
      return; // abort — chair already taken
    }
    return { status: 'occupied', current_client_id: nextClientId };
  });

  if (!result.committed) {
    throw new HttpsError('failed-precondition', 'Chair already occupied');
  }
});

// WRONG — race condition possible
async function callClient() {
  const chair = await get(chairRef);
  if (chair.val().status === 'available') { // another tap could pass here too
    await update(chairRef, { status: 'occupied' });
  }
}
```

## Environment Variables — Never Hardcode Credentials
All secrets go in `.env` (local) and Firebase Functions config (deployed).

```js
// CORRECT
const twilioSid = process.env.TWILIO_ACCOUNT_SID;

// WRONG — never commit credentials
const twilioSid = "ACxxxxxxxxxxxxxxxx";
```

`.env` file (never commit to git — add to .gitignore):
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+521234567890
DEFAULT_COUNTRY_CODE=+52
DEFAULT_TIMEZONE=America/Hermosillo
DEFAULT_LANGUAGE=es
MAX_EXTRA_TIME_MINUTES=30
```

## Security Rules — Minimum Required
Always apply these rules. Never leave the database open.

```json
{
  "rules": {
    "events": {
      "$eventId": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "queue": {
      "$eventId": {
        ".read": "auth != null",
        "$clientId": {
          ".write": "root.child('events').child($eventId).child('status').val() === 'active'"
        }
      }
    },
    "admin": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## Turn Number Assignment
Turn numbers must be assigned atomically to prevent duplicates when two guests register simultaneously.

```js
// CORRECT — transaction-safe turn number
const counterRef = ref(db, `events/${eventId}/turn_counter`);
const result = await runTransaction(counterRef, (current) => (current || 0) + 1);
const turnNumber = result.snapshot.val();

// WRONG — race condition if two guests register at same millisecond
const snapshot = await get(ref(db, `queue/${eventId}`));
const turnNumber = Object.keys(snapshot.val() || {}).length + 1;
```

## Cloud Functions — Always Log Twilio Errors, Never Throw
If Twilio fails, the queue state change must still succeed. Log the error separately.

```js
// CORRECT
try {
  await twilioClient.messages.create({ ... });
} catch (err) {
  console.error('Twilio failed:', err.message);
  await update(ref(db, `logs/${eventId}/failed_messages`), {
    [Date.now()]: { clientId, error: err.message }
  });
  // do NOT re-throw — state change already succeeded
}

// WRONG — Twilio failure rolls back the queue update
await update(clientRef, { status: 'called' });
await twilioClient.messages.create({ ... }); // if this throws, client stays in wrong state
```
