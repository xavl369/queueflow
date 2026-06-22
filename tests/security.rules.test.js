/**
 * Security rules integration tests.
 * Requires the Firebase emulator: firebase emulators:start
 * Run with: npm run test:rules
 */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, get, set } from 'firebase/database';
import { readFileSync } from 'node:fs';

const rules = readFileSync('./database.rules.json', 'utf8');
const PROJECT_ID = 'glitterbar-rules-test';
const EVENT_ID = 'evt-active';
const INACTIVE_EVENT_ID = 'evt-inactive';
const EXISTING_CLIENT_ID = 'existing-client-01';

let testEnv;
let passed = 0;
let failed = 0;

async function setup() {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: { host: 'localhost', port: 9000, rules },
  });

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await set(ref(db, `events/${EVENT_ID}`), {
      name: 'Test Event',
      status: 'active',
      turn_counter: 5,
    });
    await set(ref(db, `events/${INACTIVE_EVENT_ID}`), {
      name: 'Inactive Event',
      status: 'inactive',
      turn_counter: 0,
    });
    await set(ref(db, `queue/${EVENT_ID}/${EXISTING_CLIENT_ID}`), {
      name: 'Existing Guest',
      phone: '6641234567',
      status: 'waiting',
      turn_number: 3,
      priority: false,
      timestamps: { registered_at: Date.now() },
    });
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

async function runTests() {
  await setup();

  const guest = testEnv.unauthenticatedContext().database();
  const admin = testEnv.authenticatedContext('admin-uid').database();

  // ── Events ────────────────────────────────────────────────────
  console.log('\nEvents:');

  await test('guest can read an event (needed for registration page)', async () => {
    await assertSucceeds(get(ref(guest, `events/${EVENT_ID}`)));
  });

  await test('guest cannot write to event metadata', async () => {
    await assertFails(set(ref(guest, `events/${EVENT_ID}/status`), 'closed'));
  });

  await test('authenticated admin can write to event metadata', async () => {
    await assertSucceeds(set(ref(admin, `events/${EVENT_ID}/name`), 'Updated Name'));
  });

  await test('guest can write to turn_counter when event is active', async () => {
    await assertSucceeds(set(ref(guest, `events/${EVENT_ID}/turn_counter`), 6));
  });

  await test('guest cannot write to turn_counter when event is inactive', async () => {
    await assertFails(set(ref(guest, `events/${INACTIVE_EVENT_ID}/turn_counter`), 1));
  });

  // ── Queue ─────────────────────────────────────────────────────
  console.log('\nQueue:');

  await test('guest cannot read the queue (privacy)', async () => {
    await assertFails(get(ref(guest, `queue/${EVENT_ID}`)));
  });

  await test('authenticated admin can read the queue', async () => {
    await assertSucceeds(get(ref(admin, `queue/${EVENT_ID}`)));
  });

  await test('guest can create a new queue entry when event is active', async () => {
    await assertSucceeds(set(ref(guest, `queue/${EVENT_ID}/-new-valid-key`), {
      name: 'María García',
      phone: '6641234567',
      status: 'waiting',
      turn_number: 6,
      priority: false,
      timestamps: { registered_at: Date.now() },
    }));
  });

  await test('guest cannot overwrite an existing queue entry', async () => {
    await assertFails(set(ref(guest, `queue/${EVENT_ID}/${EXISTING_CLIENT_ID}`), {
      name: 'Hacker',
      phone: '6640000000',
      status: 'waiting',
      turn_number: 99,
      priority: false,
      timestamps: { registered_at: Date.now() },
    }));
  });

  await test('guest cannot set status other than waiting on new entry', async () => {
    await assertFails(set(ref(guest, `queue/${EVENT_ID}/-bad-status`), {
      name: 'Test',
      phone: '6641234567',
      status: 'attending',
      turn_number: 7,
      priority: false,
      timestamps: { registered_at: Date.now() },
    }));
  });

  await test('guest cannot set priority: true on new entry', async () => {
    await assertFails(set(ref(guest, `queue/${EVENT_ID}/-bad-priority`), {
      name: 'Test',
      phone: '6641234567',
      status: 'waiting',
      turn_number: 7,
      priority: true,
      timestamps: { registered_at: Date.now() },
    }));
  });

  await test('guest cannot write entry with an invalid phone number', async () => {
    await assertFails(set(ref(guest, `queue/${EVENT_ID}/-bad-phone`), {
      name: 'Test',
      phone: 'notaphone',
      status: 'waiting',
      turn_number: 7,
      priority: false,
      timestamps: { registered_at: Date.now() },
    }));
  });

  await test('guest cannot write entry with an empty name', async () => {
    await assertFails(set(ref(guest, `queue/${EVENT_ID}/-empty-name`), {
      name: '',
      phone: '6641234567',
      status: 'waiting',
      turn_number: 7,
      priority: false,
      timestamps: { registered_at: Date.now() },
    }));
  });

  await test('guest cannot create a queue entry when event is inactive', async () => {
    await assertFails(set(ref(guest, `queue/${INACTIVE_EVENT_ID}/-new-key`), {
      name: 'Test',
      phone: '6641234567',
      status: 'waiting',
      turn_number: 1,
      priority: false,
      timestamps: { registered_at: Date.now() },
    }));
  });

  // ── Admin ─────────────────────────────────────────────────────
  console.log('\nAdmin:');

  await test('guest cannot read admin data', async () => {
    await assertFails(get(ref(guest, 'admin')));
  });

  await test('guest cannot write admin data', async () => {
    await assertFails(set(ref(guest, 'admin/someone'), { role: 'admin' }));
  });

  await test('authenticated admin can read admin data', async () => {
    await assertSucceeds(get(ref(admin, 'admin')));
  });

  // ── Logs ──────────────────────────────────────────────────────
  console.log('\nLogs:');

  await test('guest cannot read logs', async () => {
    await assertFails(get(ref(guest, `logs/${EVENT_ID}`)));
  });

  await test('authenticated admin can read logs', async () => {
    await assertSucceeds(get(ref(admin, `logs/${EVENT_ID}`)));
  });

  await testEnv.cleanup();

  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('\nTest setup failed (is the emulator running?):', err.message);
  process.exit(1);
});
