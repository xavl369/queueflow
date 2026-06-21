// Run with: node scripts/seed-emulator.js
// Requires emulators to be running: npm run emulators

const AUTH_URL = 'http://127.0.0.1:9099';
const DB_URL   = 'http://127.0.0.1:9000';
const PROJECT  = 'glitterbar-9f9e2-default-rtdb';
const API_KEY  = 'emulator-fake-key';

// Create admin user in Auth emulator
const signUp = await fetch(
  `${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@glitterbar.com', password: 'nergal1A.', returnSecureToken: false }),
  }
);

if (signUp.ok) {
  console.log('✓ Admin user created: admin@glitterbar.com / nergal1A.');
} else {
  const err = await signUp.json();
  if (err.error?.message === 'EMAIL_EXISTS') {
    console.log('✓ Admin user already exists');
  } else {
    console.error('✗ Auth error:', err.error?.message);
    process.exit(1);
  }
}

// Seed test event in Database emulator
const dbWrite = await fetch(
  `${DB_URL}/events/test-evt.json?ns=${PROJECT}`,
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Evento de Prueba',
      status: 'active',
      turn_counter: 0,
      chairs: {
        '1': { status: 'available', current_client_id: null },
        '2': { status: 'available', current_client_id: null },
      },
    }),
  }
);

if (dbWrite.ok) {
  console.log('✓ Test event seeded — open http://localhost:5173/admin/test-evt');
} else {
  console.error('✗ Database error:', await dbWrite.text());
  process.exit(1);
}
