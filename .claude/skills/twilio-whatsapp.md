# Skill: Twilio WhatsApp — Glitter Bar

## Context
This project sends WhatsApp notifications to guests in Mexico (+52).
All messages are sent from Firebase Cloud Functions — never from the React frontend.
Twilio credentials are NEVER exposed to the client.

## Message Types Used in This Project

| Trigger | Category | Template Required | Mexico Rate |
|---|---|---|---|
| Registration confirmation | Utility | Yes | ~$0.008 |
| Chair ready alert | Utility | Yes | ~$0.008 |
| Reactivation notice | Utility | Yes | ~$0.008 |

All messages are **Utility** templates (triggered by user actions, not marketing).
Never classify these as Marketing — it costs ~5x more.

## Twilio Client Setup in Cloud Functions

```js
// functions/src/twilio.js
const twilio = require('twilio');

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  return twilio(accountSid, authToken);
}

module.exports = { getTwilioClient };
```

## Phone Number Formatting — Always Add Country Code
Guest phones are stored as 10 digits (e.g. `6621234567`).
Always prepend the country code before sending.

```js
// CORRECT
function formatPhone(phone, countryCode = '+52') {
  const digits = phone.replace(/\D/g, ''); // strip non-digits
  if (digits.length === 10) return `${countryCode}${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return `+${digits}`;
  throw new Error(`Invalid phone number: ${phone}`);
}

// Usage
const to = `whatsapp:${formatPhone(client.phone)}`;
const from = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;

// WRONG — sending without country code
const to = `whatsapp:${client.phone}`; // will fail
```

## Sending the Chair-Ready Message (MSG 2 — Most Critical)

```js
// functions/src/notifications.js
const { getTwilioClient } = require('./twilio');
const { ref, update } = require('firebase-admin/database');

async function sendChairReady(db, eventId, clientId, client, chairNumber) {
  const message = `¡Hola ${client.name}! 💫 Tu Silla ${chairNumber} en Glitter Bar está lista. Tienes 3 minutos para presentarte. ¡Te esperamos! ✨`;

  try {
    const twilioClient = getTwilioClient();
    await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${formatPhone(client.phone)}`,
    });

    // Log success
    await update(ref(db, `logs/${eventId}/messages/${clientId}`), {
      chair_ready_sent_at: Date.now(),
      status: 'delivered',
    });

  } catch (err) {
    // CRITICAL: log error but do NOT re-throw
    // The queue state change already succeeded — Twilio failure must not roll it back
    console.error(`Twilio failed for client ${clientId}:`, err.message);
    await update(ref(db, `logs/${eventId}/messages/${clientId}`), {
      chair_ready_sent_at: Date.now(),
      status: 'failed',
      error: err.message,
    });
  }
}

module.exports = { sendChairReady };
```

## Template vs Free-Form Messages
WhatsApp has strict rules. Breaking them causes message failures.

```
RULE: You can only send free-form text if the guest messaged YOU first
      within the last 24 hours (customer service window).

Since guests never message the Glitter Bar number first,
ALL outbound messages in this app must use approved templates.

Template format example (submit this exact text to Twilio for approval):
"¡Hola {{1}}! 💫 Tu Silla {{2}} en Glitter Bar está lista.
Tienes 3 minutos para presentarte. ¡Te esperamos! ✨"

Where {{1}} = guest name, {{2}} = chair number
```

## SMS Fallback for Development and QA
During development, use SMS (no template approval needed).
Switch to WhatsApp for production with a single env variable.

```js
// functions/src/notifications.js
async function sendMessage(phone, message) {
  const USE_WHATSAPP = process.env.USE_WHATSAPP === 'true';
  const formattedPhone = formatPhone(phone);

  const messageParams = {
    body: message,
    from: USE_WHATSAPP
      ? `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`
      : process.env.TWILIO_PHONE_NUMBER,
    to: USE_WHATSAPP
      ? `whatsapp:${formattedPhone}`
      : formattedPhone,
  };

  return getTwilioClient().messages.create(messageParams);
}
```

`.env` switch:
```
USE_WHATSAPP=false   # during development/QA
USE_WHATSAPP=true    # for live events
```

## Environment Variables — Never in Code
```js
// CORRECT — read from environment
const sid = process.env.TWILIO_ACCOUNT_SID;

// WRONG — never hardcode
const sid = 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

For Firebase Cloud Functions, set these before deploying:
```bash
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_PHONE_NUMBER
```

## Testing Without Sending Real Messages
Use Twilio's test credentials during development to avoid charges.

```js
// Test credentials — safe to commit (they don't send real messages)
// Get from Twilio Console > Settings > Test Credentials
const TEST_SID = 'ACtest...';
const TEST_TOKEN = 'your_test_token';

// Test numbers that always succeed/fail:
// +15005550006 — always succeeds
// +15005550001 — always fails (invalid number)
// +15005550009 — always fails (cannot receive SMS)
```
