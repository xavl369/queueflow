import { describe, it, expect } from 'vitest';
import { isCallButtonDisabled } from './isCallButtonDisabled.js';

const availableChair = { status: 'available' };
const occupiedChair  = { status: 'occupied' };
const waiting        = [{ id: '1', status: 'waiting' }];

describe('isCallButtonDisabled', () => {
  it('returns true when event is inactive', () => {
    expect(isCallButtonDisabled(availableChair, waiting, 'inactive')).toBe(true);
  });

  it('returns true when event is closed', () => {
    expect(isCallButtonDisabled(availableChair, waiting, 'closed')).toBe(true);
  });

  it('returns true when chair is occupied', () => {
    expect(isCallButtonDisabled(occupiedChair, waiting, 'active')).toBe(true);
  });

  it('returns true when no clients are waiting', () => {
    expect(isCallButtonDisabled(availableChair, [], 'active')).toBe(true);
  });

  it('returns false when event active, chair available, clients waiting', () => {
    expect(isCallButtonDisabled(availableChair, waiting, 'active')).toBe(false);
  });

  it('returns true when chairData is null', () => {
    expect(isCallButtonDisabled(null, waiting, 'active')).toBe(true);
  });
});
