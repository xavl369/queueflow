# Skill: React Mobile-First — Glitter Bar

## Context
The admin panel is used ONE-HANDED on a phone during a live event.
The guest registration page is used by people in a noisy party environment.
Every component must be designed for touch, not mouse.

## Tap Target Sizes — Minimum Always
All interactive elements must meet minimum touch target size.

```jsx
// CORRECT — 48px minimum height on all buttons
<button style={{ minHeight: '48px', padding: '12px 24px' }}>
  Llamar Siguiente
</button>

// WRONG — too small to tap reliably on mobile
<button style={{ padding: '4px 8px' }}>Llamar</button>
```

## No Hover States for Critical Actions
Do not rely on hover for any information or interaction. Mobile has no hover.

```jsx
// WRONG — hover tooltip not visible on touch devices
<button title="Press to call next client">📞</button>

// CORRECT — label always visible
<button>📞 Llamar Siguiente</button>
```

## Chair Cards — Always Visible, Never Behind a Tab
The two chair cards must always be visible on screen without scrolling.
Use a fixed top section, scrollable list below.

```jsx
// CORRECT layout structure
<div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
  <EventToggleBar />                          {/* fixed height */}
  <div style={{ display: 'flex', flex: '0 0 auto' }}>
    <ChairCard chair={1} />
    <ChairCard chair={2} />
  </div>
  <div style={{ flex: 1, overflowY: 'auto' }}>  {/* scrollable */}
    <WaitingList />
    <AbsentList />
  </div>
  <LiveCounterBar />                          {/* fixed height */}
</div>
```

## Color System — Use These Exact Values
Consistent colors for instant visual reading during a fast-paced event.

```js
const COLORS = {
  available: '#9E9E9E',   // gray    — chair free
  called:    '#FFC107',   // yellow  — client called, waiting
  attending: '#4CAF50',   // green   — session active
  alert:     '#F44336',   // red     — timer expired or no-show
  priority:  '#FFD700',   // gold    — reactivated client
  brand:     '#FF69B4',   // pink    — Glitter Bar brand accent
};
```

## Timers — Visual Only, No Auto-Actions
Timers are for the operator's awareness only. They never fire automatic state changes.

```jsx
// CORRECT — visual countdown, operator decides
function CountdownTimer({ startedAt }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const remaining = 180 - elapsed; // 3 minutes
  const isExpired = remaining <= 0;
  const display = isExpired
    ? '0:00'
    : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;

  return (
    <span style={{ color: isExpired ? COLORS.alert : 'inherit', fontWeight: 'bold' }}>
      {display}
    </span>
  );
}

// WRONG — auto-firing an action at timer end
useEffect(() => {
  if (remaining <= 0) handleNoShow(); // never do this
}, [remaining]);
```

## Forms — Large Inputs, Correct Keyboard Types
Guest registration runs on a party guest's phone. Make it effortless.

```jsx
// CORRECT
<input
  type="tel"                    // opens numeric keyboard on mobile
  inputMode="numeric"           // reinforces numeric keyboard
  maxLength={10}
  pattern="[0-9]{10}"
  placeholder="Número de celular (10 dígitos)"
  style={{ fontSize: '16px', padding: '14px', width: '100%' }} // 16px prevents iOS zoom
/>

// WRONG — generic input zooms in on iOS, wrong keyboard type
<input type="text" placeholder="Teléfono" />
```

## Confirmation Dialogs — Only for Destructive Actions
Only one action requires a confirmation: closing the event (irreversible).
All other actions are single-tap — no confirmations that slow the operator down.

```jsx
// Only action that needs confirmation
function CloseEventButton({ onConfirm }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <div>
        <p>¿Cerrar el evento? Esta acción no se puede deshacer.</p>
        <button onClick={onConfirm}>Sí, cerrar</button>
        <button onClick={() => setConfirming(false)}>Cancelar</button>
      </div>
    );
  }
  return <button onClick={() => setConfirming(true)}>Cerrar Estación</button>;
}
```

## Loading and Error States — Always Handle Both
Every Firebase operation must show loading and error feedback.
Silent failures during a live event are unacceptable.

```jsx
// CORRECT
function CallButton({ onClick }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await onClick();
    } catch (err) {
      setError('Error al llamar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={handleClick} disabled={loading} style={{ minHeight: '48px' }}>
        {loading ? 'Llamando...' : 'Llamar Siguiente'}
      </button>
      {error && <p style={{ color: COLORS.alert }}>{error}</p>}
    </>
  );
}
```

## Absent List — Collapsed by Default
The absent list starts collapsed to keep the main view clean.
A badge count tells the operator how many are absent without expanding.

```jsx
function AbsentList({ clients }) {
  const [expanded, setExpanded] = useState(false);
  const count = clients.length;
  return (
    <div>
      <button onClick={() => setExpanded(e => !e)} style={{ minHeight: '48px' }}>
        Ausentes ({count}) {expanded ? '▲' : '▼'}
      </button>
      {expanded && clients.map(c => (
        <AbsentRow key={c.id} client={c} />
      ))}
    </div>
  );
}
```
