jest.mock('twilio', () => {
  const mockCreate = jest.fn().mockResolvedValue({ sid: 'SMtest123' });
  const mockClient = { messages: { create: mockCreate } };
  return jest.fn().mockReturnValue(mockClient);
});

const { formatPhone, sendMessage, sendChairReady, sendRegistrationConfirmation, sendReactivation } = require('./notifications');

describe('formatPhone', () => {
  test('prepends +52 to 10-digit number', () => {
    expect(formatPhone('6621234567')).toBe('+526621234567');
  });

  test('accepts 12-digit number starting with 52', () => {
    expect(formatPhone('526621234567')).toBe('+526621234567');
  });

  test('uses custom country code', () => {
    expect(formatPhone('6621234567', '+1')).toBe('+16621234567');
  });

  test('strips non-digit characters', () => {
    expect(formatPhone('662-123-4567')).toBe('+526621234567');
  });

  test('throws on invalid number', () => {
    expect(() => formatPhone('12345')).toThrow();
    expect(() => formatPhone('')).toThrow();
  });
});

describe('sendMessage', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      TWILIO_ACCOUNT_SID: 'ACtest',
      TWILIO_AUTH_TOKEN: 'testtoken',
      TWILIO_PHONE_NUMBER: '+15005550006',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  test('sends SMS when USE_WHATSAPP=false', async () => {
    process.env.USE_WHATSAPP = 'false';
    const twilio = require('twilio');
    const mockCreate = twilio().messages.create;

    await sendMessage('6621234567', 'Hola test');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+526621234567',
        from: '+15005550006',
        body: 'Hola test',
      })
    );
  });

  test('sends WhatsApp when USE_WHATSAPP=true', async () => {
    process.env.USE_WHATSAPP = 'true';
    const twilio = require('twilio');
    const mockCreate = twilio().messages.create;

    await sendMessage('6621234567', 'Hola test');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'whatsapp:+526621234567',
        from: 'whatsapp:+15005550006',
        body: 'Hola test',
      })
    );
  });
});

// ─── sendChairReady ────────────────────────────────────────────────────────────

describe('sendChairReady', () => {
  const originalEnv = process.env;
  const mockDbUpdate = jest.fn().mockResolvedValue({});
  const db = { ref: (_path) => ({ update: mockDbUpdate }) };
  const client = { name: 'Ana', phone: '6621234567' };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      TWILIO_ACCOUNT_SID: 'ACtest',
      TWILIO_AUTH_TOKEN: 'testtoken',
      TWILIO_PHONE_NUMBER: '+15005550006',
      USE_WHATSAPP: 'false',
    };
    mockDbUpdate.mockResolvedValue({});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  test('sends message body containing client name and chair number', async () => {
    const twilio = require('twilio');
    const mockCreate = twilio().messages.create;

    await sendChairReady(db, 'evt-1', 'c1', client, 2);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('Ana'),
      })
    );
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('2'),
      })
    );
  });

  test('logs chair_ready_sent_at with status=delivered on success', async () => {
    await sendChairReady(db, 'evt-1', 'c1', client, 1);

    expect(mockDbUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        chair_ready_sent_at: expect.any(Number),
        status: 'delivered',
      })
    );
  });

  test('catches Twilio error and does not throw', async () => {
    const twilio = require('twilio');
    twilio().messages.create.mockRejectedValueOnce(new Error('Network error'));

    await expect(sendChairReady(db, 'evt-1', 'c1', client, 1)).resolves.toBeUndefined();
  });

  test('logs status=failed and error message when Twilio fails', async () => {
    const twilio = require('twilio');
    twilio().messages.create.mockRejectedValueOnce(new Error('Twilio down'));

    await sendChairReady(db, 'evt-1', 'c1', client, 1);

    expect(mockDbUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        error: 'Twilio down',
      })
    );
  });
});

// ─── sendRegistrationConfirmation ─────────────────────────────────────────────

describe('sendRegistrationConfirmation', () => {
  const originalEnv = process.env;
  const mockDbUpdate = jest.fn().mockResolvedValue({});
  const db = { ref: (_path) => ({ update: mockDbUpdate }) };
  const client = { name: 'Luis', phone: '6629876543', turn_number: 5 };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      TWILIO_ACCOUNT_SID: 'ACtest',
      TWILIO_AUTH_TOKEN: 'testtoken',
      TWILIO_PHONE_NUMBER: '+15005550006',
      USE_WHATSAPP: 'false',
    };
    mockDbUpdate.mockResolvedValue({});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  test('sends message body containing client name and turn number', async () => {
    const twilio = require('twilio');
    const mockCreate = twilio().messages.create;

    await sendRegistrationConfirmation(db, 'evt-1', 'c2', client);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('Luis'),
      })
    );
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('5'),
      })
    );
  });

  test('logs registration_sent_at with status=delivered on success', async () => {
    await sendRegistrationConfirmation(db, 'evt-1', 'c2', client);

    expect(mockDbUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        registration_sent_at: expect.any(Number),
        status: 'delivered',
      })
    );
  });

  test('catches Twilio error and does not throw', async () => {
    const twilio = require('twilio');
    twilio().messages.create.mockRejectedValueOnce(new Error('Auth failed'));

    await expect(
      sendRegistrationConfirmation(db, 'evt-1', 'c2', client)
    ).resolves.toBeUndefined();
  });

  test('logs status=failed when Twilio fails', async () => {
    const twilio = require('twilio');
    twilio().messages.create.mockRejectedValueOnce(new Error('Auth failed'));

    await sendRegistrationConfirmation(db, 'evt-1', 'c2', client);

    expect(mockDbUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' })
    );
  });
});

// ─── sendReactivation ─────────────────────────────────────────────────────────

describe('sendReactivation', () => {
  const originalEnv = process.env;
  const mockDbUpdate = jest.fn().mockResolvedValue({});
  const db = { ref: (_path) => ({ update: mockDbUpdate }) };
  const client = { name: 'Ana', phone: '6621234567' };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      TWILIO_ACCOUNT_SID: 'ACtest',
      TWILIO_AUTH_TOKEN: 'testtoken',
      TWILIO_PHONE_NUMBER: '+15005550006',
      USE_WHATSAPP: 'false',
    };
    mockDbUpdate.mockResolvedValue({});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  test('sends message body containing client name', async () => {
    const twilio = require('twilio');
    const mockCreate = twilio().messages.create;

    await sendReactivation(db, 'evt-1', 'c1', client);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('Ana'),
      })
    );
  });

  test('logs reactivation_sent_at with status=delivered on success', async () => {
    await sendReactivation(db, 'evt-1', 'c1', client);

    expect(mockDbUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        reactivation_sent_at: expect.any(Number),
        status: 'delivered',
      })
    );
  });

  test('catches Twilio error and does not throw', async () => {
    const twilio = require('twilio');
    twilio().messages.create.mockRejectedValueOnce(new Error('Network error'));

    await expect(sendReactivation(db, 'evt-1', 'c1', client)).resolves.toBeUndefined();
  });

  test('logs status=failed when Twilio fails', async () => {
    const twilio = require('twilio');
    twilio().messages.create.mockRejectedValueOnce(new Error('Auth failed'));

    await sendReactivation(db, 'evt-1', 'c1', client);

    expect(mockDbUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        error: 'Auth failed',
      })
    );
  });
});
