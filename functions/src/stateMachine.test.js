const { validateTransition, validateEventTransition, VALID_TRANSITIONS } = require('./stateMachine');

describe('VALID_TRANSITIONS', () => {
  test('exports the correct transition map', () => {
    expect(VALID_TRANSITIONS.waiting).toEqual(['called']);
    expect(VALID_TRANSITIONS.called).toEqual(['attending', 'absent']);
    expect(VALID_TRANSITIONS.attending).toEqual(['finished']);
    expect(VALID_TRANSITIONS.absent).toEqual(['waiting']);
    expect(VALID_TRANSITIONS.finished).toEqual([]);
  });
});

describe('validateTransition — valid paths', () => {
  test('waiting -> called', () => {
    expect(() => validateTransition('waiting', 'called')).not.toThrow();
  });
  test('called -> attending', () => {
    expect(() => validateTransition('called', 'attending')).not.toThrow();
  });
  test('called -> absent', () => {
    expect(() => validateTransition('called', 'absent')).not.toThrow();
  });
  test('attending -> finished', () => {
    expect(() => validateTransition('attending', 'finished')).not.toThrow();
  });
  test('absent -> waiting', () => {
    expect(() => validateTransition('absent', 'waiting')).not.toThrow();
  });
});

describe('validateTransition — blocked paths', () => {
  test('waiting -> attending (skip called)', () => {
    expect(() => validateTransition('waiting', 'attending')).toThrow();
  });
  test('attending -> waiting (backwards)', () => {
    expect(() => validateTransition('attending', 'waiting')).toThrow();
  });
  test('finished -> anything (terminal)', () => {
    expect(() => validateTransition('finished', 'waiting')).toThrow();
    expect(() => validateTransition('finished', 'called')).toThrow();
  });
  test('called -> waiting (must use absent -> reactivate flow)', () => {
    expect(() => validateTransition('called', 'waiting')).toThrow();
  });
  test('unknown status throws', () => {
    expect(() => validateTransition('bogus', 'waiting')).toThrow();
  });
});

describe('validateEventTransition — valid paths', () => {
  test('inactive -> active', () => {
    expect(() => validateEventTransition('inactive', 'active')).not.toThrow();
  });
  test('active -> closed', () => {
    expect(() => validateEventTransition('active', 'closed')).not.toThrow();
  });
});

describe('validateEventTransition — blocked paths', () => {
  test('closed -> active (terminal)', () => {
    expect(() => validateEventTransition('closed', 'active')).toThrow();
  });
  test('active -> inactive (backwards)', () => {
    expect(() => validateEventTransition('active', 'inactive')).toThrow();
  });
  test('inactive -> closed (skip active)', () => {
    expect(() => validateEventTransition('inactive', 'closed')).toThrow();
  });
});
