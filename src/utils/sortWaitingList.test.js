import { describe, it, expect } from 'vitest';
import { sortWaitingList } from './sortWaitingList.js';

const makeClient = (id, turn_number, priority = false, status = 'waiting') => ({
  id, turn_number, priority, status,
});

describe('sortWaitingList', () => {
  it('returns only waiting clients', () => {
    const clients = [
      makeClient('a', 1, false, 'waiting'),
      makeClient('b', 2, false, 'called'),
      makeClient('c', 3, false, 'attending'),
      makeClient('d', 4, false, 'finished'),
      makeClient('e', 5, false, 'absent'),
    ];
    const result = sortWaitingList(clients);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('sorts regular clients by turn_number ascending', () => {
    const clients = [
      makeClient('c', 3),
      makeClient('a', 1),
      makeClient('b', 2),
    ];
    const result = sortWaitingList(clients);
    expect(result.map(c => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('puts priority clients before regular clients', () => {
    const clients = [
      makeClient('regular1', 1),
      makeClient('regular2', 2),
      makeClient('priority1', 5, true),
    ];
    const result = sortWaitingList(clients);
    expect(result[0].id).toBe('priority1');
    expect(result[1].id).toBe('regular1');
    expect(result[2].id).toBe('regular2');
  });

  it('sorts multiple priority clients by turn_number among themselves', () => {
    const clients = [
      makeClient('p2', 8, true),
      makeClient('p1', 3, true),
      makeClient('regular', 1),
    ];
    const result = sortWaitingList(clients);
    expect(result[0].id).toBe('p1');
    expect(result[1].id).toBe('p2');
    expect(result[2].id).toBe('regular');
  });

  it('returns empty array when no waiting clients', () => {
    const clients = [makeClient('a', 1, false, 'called')];
    expect(sortWaitingList(clients)).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(sortWaitingList([])).toEqual([]);
  });
});
