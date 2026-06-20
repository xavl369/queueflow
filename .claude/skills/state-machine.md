# Skill: Queue State Machine — Glitter Bar

## The Only Valid State Transitions
Never implement a transition not listed here. Reject all others.

```
VALID TRANSITIONS:
  waiting   -> called      (operator presses LLAMAR)
  called    -> attending   (operator presses LLEGO)
  called    -> absent      (operator presses NO VINO)
  attending -> finished    (operator presses FINALIZADO)
  absent    -> waiting     (operator presses REACTIVAR — sets priority: true)

INVALID (must be blocked):
  waiting   -> attending   (cannot skip called)
  waiting   -> finished    (cannot skip)
  attending -> waiting     (cannot go backwards)
  finished  -> anything    (terminal state — no recovery)
  called    -> waiting     (use NO VINO -> REACTIVAR flow instead)
```

## Transition Validator — Use in Every Cloud Function

```js
// functions/src/stateMachine.js
const VALID_TRANSITIONS = {
  waiting:   ['called'],
  called:    ['attending', 'absent'],
  attending: ['finished'],
  absent:    ['waiting'],
  finished:  [],  // terminal
};

function validateTransition(currentStatus, nextStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(
      `Invalid transition: ${currentStatus} -> ${nextStatus}. ` +
      `Allowed from ${currentStatus}: [${allowed.join(', ')}]`
    );
  }
}

module.exports = { validateTransition };

// Usage in any Cloud Function:
validateTransition(client.status, 'called'); // throws if invalid
```

## Priority Queue Logic — Waiting List Sort Order
The waiting list must ALWAYS be sorted this way, without exception:

```
Sort: priority DESC, turn_number ASC

Result:
  1. ⭐ Reactivated clients (priority: true) — in their original turn_number order
  2. Regular waiting clients (priority: false) — in turn_number order
```

```js
// CORRECT — sort function for the waiting list
function sortWaitingList(clients) {
  return clients
    .filter(c => c.status === 'waiting')
    .sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority; // priority first
      return a.turn_number - b.turn_number; // then by turn number
    });
}

// WRONG — ignores priority flag
clients.sort((a, b) => a.turn_number - b.turn_number);
```

## Reactivated Client Display Rule
Reactivated clients (priority: true) show `#—` in the active list, not their original turn number.
Their original turn_number is preserved in the DB for historical records only.

```jsx
// CORRECT
<span>{client.priority ? '#—' : `#${client.turn_number}`}</span>
<span>{client.name}</span>
{client.priority && <span>⭐ PRIORITARIA</span>}

// WRONG — shows confusing turn number in active list
<span>#{client.turn_number}</span>
```

## Chair Occupancy Rules

```
A chair has two fields in the DB:
  chairs/1/status:             "available" | "occupied"
  chairs/1/current_client_id:  CLIENT_ID | null

Rules:
  - status = "occupied" when a client is in "called" OR "attending"
  - status = "available" when no active client (including after NO VINO and FINALIZADO)
  - current_client_id is null whenever status = "available"
  - These two fields must ALWAYS be updated together in the same transaction
```

```js
// CORRECT — atomic update of both fields
await runTransaction(chairRef, (chair) => {
  if (chair?.status === 'occupied') return; // abort
  return { status: 'occupied', current_client_id: clientId };
});

// WRONG — two separate writes can get out of sync
await update(chairRef, { status: 'occupied' });
await update(chairRef, { current_client_id: clientId }); // could fail independently
```

## [LLAMAR] Button Disabled States
The LLAMAR button must be disabled in these exact conditions:

```js
function isCallButtonDisabled(chair, waitingClients, eventStatus) {
  if (eventStatus !== 'active') return true;       // event not open
  if (chair.status === 'occupied') return true;    // chair busy
  if (waitingClients.length === 0) return true;    // nobody waiting
  return false;
}
```

## Timestamps — Always Store in UTC Milliseconds
All timestamps are Unix milliseconds (Date.now()), stored in UTC.
Display formatting uses the local timezone (America/Hermosillo) only in the UI.

```js
// CORRECT — store UTC ms
await update(clientRef, { 'timestamps/called_at': Date.now() });

// Display in UI only
const displayTime = new Date(client.timestamps.called_at)
  .toLocaleTimeString('es-MX', { timeZone: 'America/Hermosillo' });

// WRONG — never store formatted strings as timestamps
await update(clientRef, { called_at: '14:32' }); // useless for calculations
```

## Event Lifecycle — Status Transitions

```
inactive -> active    (operator opens registration — one tap, no confirmation)
active   -> closed    (operator closes event — REQUIRES confirmation dialog)
closed   -> anything  (BLOCKED — terminal state, no recovery within same event)
```

```js
// CORRECT — guard against invalid event transitions
function validateEventTransition(current, next) {
  const allowed = { inactive: ['active'], active: ['closed'], closed: [] };
  if (!allowed[current]?.includes(next)) {
    throw new Error(`Cannot transition event from ${current} to ${next}`);
  }
}
```
