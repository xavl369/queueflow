jest.mock('twilio', () => {
  const mockCreate = jest.fn().mockResolvedValue({ sid: 'SMtest123' });
  const mockClient = { messages: { create: mockCreate } };
  return jest.fn().mockReturnValue(mockClient);
});

const { formatPhone, sendMessage } = require('./notifications');

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
