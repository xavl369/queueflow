# Glitter Bar — Project Specification

## What We Are Building
A real-time queue management PWA for glitter/visagismo stations at social
events in Hermosillo, Sonora, Mexico. Guests scan a QR code to register,
receive a WhatsApp notification when their chair is ready, and the operator
manages everything from a mobile admin panel.

## Tech Stack (Non-negotiable)
- Frontend: React + Vite
- Hosting: Firebase Hosting
- Database: Firebase Realtime Database (NOT Firestore)
- Backend logic: Firebase Cloud Functions
- Auth: Firebase Authentication (email/password, single admin account)
- Notifications: Twilio WhatsApp (Utility template) with SMS fallback for dev
- PWA: vite-plugin-pwa

## Three Views
1. /register/:eventId — Public registration page (guest scans QR)
2. /admin/:eventId   — Admin panel (operator's phone, requires auth)
3. /login            — Login page (redirects to admin after auth)

## Database Structure
See .claude/skills/firebase.md for the complete JSON schema.

Key collections:
  events/EVENT_ID        — event metadata, status, chair states
  queue/EVENT_ID/CLIENT_ID — guest records with status and timestamps
  admin/USER_ID          — admin accounts
  logs/EVENT_ID          — message delivery logs

## Client Status State Machine
See .claude/skills/state-machine.md for all valid transitions.

  waiting -> called -> attending -> finished
  called -> absent -> (reactivate) -> waiting (priority: true)

## Event Status
  inactive -> active -> closed (terminal)

## Chair Logic
- Two independent chairs: Silla 1 and Silla 2
- Each chair: status (available/occupied) + current_client_id
- A chair can only have ONE client in called/attending at a time
- This check MUST happen in a Cloud Function transaction (see firebase.md skill)

## Notification Messages
  MSG 1 — Registration confirmation (auto, on form submit)
  MSG 2 — Chair ready alert (on LLAMAR press — most critical)
  MSG 3 — Reactivation notice (on REACTIVAR press — optional)
  MSG 4 — Post-service thank you (Phase 2 only — NOT in MVP)

All messages are Utility templates (not Marketing).
See .claude/skills/twilio-whatsapp.md for implementation.

## Admin Panel Layout (top to bottom)
  1. Event status toggle bar (always visible)
  2. Two chair cards side by side (always visible, never scrolled away)
  3. Waiting list (scrollable)
  4. Absent list (collapsed by default)
  5. Live counter bar: Atendidos | En espera | Ausentes

## Environment Variables
  TWILIO_ACCOUNT_SID
  TWILIO_AUTH_TOKEN
  TWILIO_PHONE_NUMBER
  USE_WHATSAPP=false (dev) / true (production)
  DEFAULT_COUNTRY_CODE=+52
  DEFAULT_TIMEZONE=America/Hermosillo
  DEFAULT_LANGUAGE=es
  MAX_EXTRA_TIME_MINUTES=30

## Phase 2 (Do Not Build Now)
  - Photo capture after FINALIZADO
  - Post-service WhatsApp with photo link
  - Multi-tenant / franchise support
  These are prepared in the DB schema but not implemented in MVP.

## Build Order
1. Firebase project structure and config
2. Public registration page + Firebase write
3. Admin panel shell with real-time listener
4. Chair state machine and button logic (Cloud Functions)
5. Twilio Cloud Function integration
6. Master event toggle (open/close)
7. Absent list and reactivation logic
8. PWA configuration
9. Security rules
10. QA and deployment

## TDD Rule — Non-Negotiable
For every phase:
  1. Write tests first (they should fail)
  2. Run tests — confirm they are red
  3. Write implementation
  4. Run tests — confirm they are green
  5. Give me manual QA checklist for this phase
  6. Wait for my go-ahead before next phase

Test commands:
  Frontend:  npm run test (Vitest)
  Functions: cd functions && npm run test (Jest)
  Emulator:  firebase emulators:start