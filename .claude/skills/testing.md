\# Skill: Testing — Glitter Bar



\## Tools

\- Vitest — frontend unit tests (React + Vite ecosystem)

\- Jest — Cloud Functions unit tests

\- Firebase Emulator Suite — integration tests without real Firebase



\## What Always Gets a Unit Test

\- stateMachine.js — every transition (valid and invalid)

\- sortWaitingList() — priority ordering

\- formatPhone() — all phone number formats

\- isCallButtonDisabled() — all disabled conditions

\- validateEventTransition() — all event state transitions



\## Firebase Emulator for Integration Tests

Use the Firebase Emulator so tests never touch the real database.



firebase.json must include:

{

&#x20; "emulators": {

&#x20;   "database": { "port": 9000 },

&#x20;   "functions": { "port": 5001 },

&#x20;   "auth": { "port": 9099 }

&#x20; }

}



In tests:

connectDatabaseEmulator(db, 'localhost', 9000);

connectFunctionsEmulator(functions, 'localhost', 5001);



\## Test File Convention

Every file has a sibling test file:

&#x20; src/utils/stateMachine.js

&#x20; src/utils/stateMachine.test.js



&#x20; functions/src/notifications.js

&#x20; functions/src/notifications.test.js



\## Never Test Against Real Firebase

Never use real credentials in tests.

Never call real Twilio in tests — mock it.



\## Mocking Twilio in Tests

jest.mock('twilio', () => () => ({

&#x20; messages: {

&#x20;   create: jest.fn().mockResolvedValue({ sid: 'SMtest123' })

&#x20; }

}));

