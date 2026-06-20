import { describe, it, expect } from 'vitest';
import { formatPhone } from './formatPhone.js';

describe('formatPhone', () => {
  it('prepends +52 to a 10-digit number', () => {
    expect(formatPhone('6621234567')).toBe('+526621234567');
  });

  it('accepts a 12-digit number starting with 52 and adds +', () => {
    expect(formatPhone('526621234567')).toBe('+526621234567');
  });

  it('uses a custom country code', () => {
    expect(formatPhone('6621234567', '+1')).toBe('+16621234567');
  });

  it('strips non-digit characters before processing', () => {
    expect(formatPhone('662-123-4567')).toBe('+526621234567');
    expect(formatPhone('(662) 123 4567')).toBe('+526621234567');
  });

  it('throws on a number that is too short', () => {
    expect(() => formatPhone('12345')).toThrow();
  });

  it('throws on an empty string', () => {
    expect(() => formatPhone('')).toThrow();
  });

  it('throws on a number that is too long and does not start with 52', () => {
    expect(() => formatPhone('16621234567')).toThrow();
  });
});
