jest.mock('firebase-admin/database', () => ({
  ref: jest.fn((db, path) => path ?? '__root__'),
  get: jest.fn(),
  update: jest.fn(),
  runTransaction: jest.fn(),
}));

jest.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
  },
}));

const { ref, get, update, runTransaction } = require('firebase-admin/database');
const {
  callNextClientHandler,
  markAttendingHandler,
  markAbsentHandler,
  markFinishedHandler,
} = require('./transitions');

const db = {};

beforeEach(() => jest.clearAllMocks());

// ─── callNextClient ────────────────────────────────────────────────────────────

describe('callNextClientHandler', () => {
  it('throws when event is not active', async () => {
    get.mockResolvedValueOnce({ val: () => ({ status: 'inactive' }) });
    await expect(callNextClientHandler(db, 'evt-1', 1)).rejects.toThrow(/no está activo/);
  });

  it('throws when no clients are waiting', async () => {
    get
      .mockResolvedValueOnce({ val: () => ({ status: 'active' }) })
      .mockResolvedValueOnce({ val: () => null });
    await expect(callNextClientHandler(db, 'evt-1', 1)).rejects.toThrow(/No hay clientes/);
  });

  it('throws when chair is already occupied (transaction aborts)', async () => {
    get
      .mockResolvedValueOnce({ val: () => ({ status: 'active' }) })
      .mockResolvedValueOnce({ val: () => ({
        'c1': { name: 'Ana', status: 'waiting', turn_number: 1, priority: false },
      }) });
    runTransaction.mockResolvedValue({ committed: false });
    await expect(callNextClientHandler(db, 'evt-1', 1)).rejects.toThrow(/ya está ocupada/);
  });

  it('calls the priority client first', async () => {
    get
      .mockResolvedValueOnce({ val: () => ({ status: 'active' }) })
      .mockResolvedValueOnce({ val: () => ({
        'c1': { name: 'Regular', status: 'waiting', turn_number: 1, priority: false },
        'c2': { name: 'Priority', status: 'waiting', turn_number: 5, priority: true },
      }) });
    runTransaction.mockResolvedValue({ committed: true });
    update.mockResolvedValue({});

    const result = await callNextClientHandler(db, 'evt-1', 1);

    expect(result.clientId).toBe('c2');
    expect(update).toHaveBeenCalledWith(
      'queue/evt-1/c2',
      expect.objectContaining({ status: 'called' })
    );
  });

  it('calls the lowest turn_number among regular clients', async () => {
    get
      .mockResolvedValueOnce({ val: () => ({ status: 'active' }) })
      .mockResolvedValueOnce({ val: () => ({
        'c3': { name: 'Third',  status: 'waiting', turn_number: 3, priority: false },
        'c1': { name: 'First',  status: 'waiting', turn_number: 1, priority: false },
        'c2': { name: 'Second', status: 'waiting', turn_number: 2, priority: false },
      }) });
    runTransaction.mockResolvedValue({ committed: true });
    update.mockResolvedValue({});

    const result = await callNextClientHandler(db, 'evt-1', 1);
    expect(result.clientId).toBe('c1');
  });

  it('skips non-waiting clients', async () => {
    get
      .mockResolvedValueOnce({ val: () => ({ status: 'active' }) })
      .mockResolvedValueOnce({ val: () => ({
        'c1': { name: 'Called',   status: 'called',   turn_number: 1, priority: false },
        'c2': { name: 'Waiting',  status: 'waiting',  turn_number: 2, priority: false },
      }) });
    runTransaction.mockResolvedValue({ committed: true });
    update.mockResolvedValue({});

    const result = await callNextClientHandler(db, 'evt-1', 1);
    expect(result.clientId).toBe('c2');
  });

  it('sets called_at timestamp on the client record', async () => {
    get
      .mockResolvedValueOnce({ val: () => ({ status: 'active' }) })
      .mockResolvedValueOnce({ val: () => ({
        'c1': { name: 'Ana', status: 'waiting', turn_number: 1, priority: false },
      }) });
    runTransaction.mockResolvedValue({ committed: true });
    update.mockResolvedValue({});

    await callNextClientHandler(db, 'evt-1', 1);

    expect(update).toHaveBeenCalledWith(
      'queue/evt-1/c1',
      expect.objectContaining({ 'timestamps/called_at': expect.any(Number) })
    );
  });
});

// ─── markAttending ─────────────────────────────────────────────────────────────

describe('markAttendingHandler', () => {
  it('throws when client does not exist', async () => {
    get.mockResolvedValueOnce({ val: () => null });
    await expect(markAttendingHandler(db, 'evt-1', 'c1', 1)).rejects.toThrow(/no encontrado/);
  });

  it('throws on invalid transition (e.g. waiting -> attending)', async () => {
    get.mockResolvedValueOnce({ val: () => ({ status: 'waiting' }) });
    await expect(markAttendingHandler(db, 'evt-1', 'c1', 1)).rejects.toThrow();
  });

  it('updates status to attending with timestamp', async () => {
    get.mockResolvedValueOnce({ val: () => ({ status: 'called' }) });
    update.mockResolvedValue({});

    await markAttendingHandler(db, 'evt-1', 'c1', 1);

    expect(update).toHaveBeenCalledWith(
      'queue/evt-1/c1',
      expect.objectContaining({ status: 'attending', 'timestamps/attending_at': expect.any(Number) })
    );
  });
});

// ─── markAbsent ────────────────────────────────────────────────────────────────

describe('markAbsentHandler', () => {
  it('throws when client does not exist', async () => {
    get.mockResolvedValueOnce({ val: () => null });
    await expect(markAbsentHandler(db, 'evt-1', 'c1', 1)).rejects.toThrow(/no encontrado/);
  });

  it('throws on invalid transition (e.g. attending -> absent)', async () => {
    get.mockResolvedValueOnce({ val: () => ({ status: 'attending' }) });
    await expect(markAbsentHandler(db, 'evt-1', 'c1', 1)).rejects.toThrow();
  });

  it('sets client absent and frees the chair atomically', async () => {
    get.mockResolvedValueOnce({ val: () => ({ status: 'called' }) });
    update.mockResolvedValue({});

    await markAbsentHandler(db, 'evt-1', 'c1', 1);

    expect(update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        'queue/evt-1/c1/status': 'absent',
        'events/evt-1/chairs/1/status': 'available',
        'events/evt-1/chairs/1/current_client_id': null,
      })
    );
  });
});

// ─── markFinished ──────────────────────────────────────────────────────────────

describe('markFinishedHandler', () => {
  it('throws when client does not exist', async () => {
    get.mockResolvedValueOnce({ val: () => null });
    await expect(markFinishedHandler(db, 'evt-1', 'c1', 1)).rejects.toThrow(/no encontrado/);
  });

  it('throws on invalid transition (e.g. called -> finished)', async () => {
    get.mockResolvedValueOnce({ val: () => ({ status: 'called' }) });
    await expect(markFinishedHandler(db, 'evt-1', 'c1', 1)).rejects.toThrow();
  });

  it('sets client finished and frees the chair atomically', async () => {
    get.mockResolvedValueOnce({ val: () => ({ status: 'attending' }) });
    update.mockResolvedValue({});

    await markFinishedHandler(db, 'evt-1', 'c1', 1);

    expect(update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        'queue/evt-1/c1/status': 'finished',
        'events/evt-1/chairs/1/status': 'available',
        'events/evt-1/chairs/1/current_client_id': null,
      })
    );
  });
});
