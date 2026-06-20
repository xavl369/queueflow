import { describe, it, expect } from 'vitest';
import { validateTransition, validateEventTransition, VALID_TRANSITIONS } from './stateMachine.js';

describe('VALID_TRANSITIONS', () => {
  it('exports the correct transition map', () => {
    expect(VALID_TRANSITIONS.waiting).toEqual(['called']);
    expect(VALID_TRANSITIONS.called).toEqual(['attending', 'absent']);
    expect(VALID_TRANSITIONS.attending).toEqual(['finished']);
    expect(VALID_TRANSITIONS.absent).toEqual(['waiting']);
    expect(VALID_TRANSITIONS.finished).toEqual([]);
  });
});

describe('validateTransition — valid paths', () => {
  it('waiting -> called', () => {
    expect(() => validateTransition('waiting', 'called')).not.toThrow();
  });
  it('called -> attending', () => {
    expect(() => validateTransition('called', 'attending')).not.toThrow();
  });
  it('called -> absent', () => {
    expect(() => validateTransition('called', 'absent')).not.toThrow();
  });
  it('attending -> finished', () => {
    expect(() => validateTransition('attending', 'finished')).not.toThrow();
  });
  it('absent -> waiting', () => {
    expect(() => validateTransition('absent', 'waiting')).not.toThrow();
  });
});

describe('validateTransition — blocked paths', () => {
  it('waiting -> attending (skip called)', () => {
    expect(() => validateTransition('waiting', 'attending')).toThrow();
  });
  it('waiting -> finished (skip everything)', () => {
    expect(() => validateTransition('waiting', 'finished')).toThrow();
  });
  it('attending -> waiting (backwards)', () => {
    expect(() => validateTransition('attending', 'waiting')).toThrow();
  });
  it('finished -> anything (terminal)', () => {
    expect(() => validateTransition('finished', 'waiting')).toThrow();
    expect(() => validateTransition('finished', 'called')).toThrow();
  });
  it('called -> waiting (must use absent -> reactivate flow)', () => {
    expect(() => validateTransition('called', 'waiting')).toThrow();
  });
  it('unknown status throws', () => {
    expect(() => validateTransition('bogus', 'waiting')).toThrow();
  });
});

describe('validateEventTransition — valid paths', () => {
  it('inactive -> active', () => {
    expect(() => validateEventTransition('inactive', 'active')).not.toThrow();
  });
  it('active -> closed', () => {
    expect(() => validateEventTransition('active', 'closed')).not.toThrow();
  });
});

describe('validateEventTransition — blocked paths', () => {
  it('closed -> anything (terminal)', () => {
    expect(() => validateEventTransition('closed', 'active')).toThrow();
    expect(() => validateEventTransition('closed', 'inactive')).toThrow();
  });
  it('active -> inactive (backwards)', () => {
    expect(() => validateEventTransition('active', 'inactive')).toThrow();
  });
  it('inactive -> closed (skip active)', () => {
    expect(() => validateEventTransition('inactive', 'closed')).toThrow();
  });
});
