jest.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
  },
}));

jest.mock('./notifications', () => ({
  sendChairReady: jest.fn().mockResolvedValue(undefined),
  sendRegistrationConfirmation: jest.fn().mockResolvedValue(undefined),
  sendReactivation: jest.fn().mockResolvedValue(undefined),
}));

const {
  callNextClientHandler,
  markAttendingHandler,
  markAbsentHandler,
  markFinishedHandler,
  reactivateClientHandler,
} = require('./transitions');

// ─── mock db factory ──────────────────────────────────────────────────────────

const mockGet         = jest.fn();
const mockUpdate      = jest.fn();
const mockTransaction = jest.fn();

function createDb() {
  return {
    ref: (path) => ({
      get:         ()       => mockGet(path),
      update:      (data)   => mockUpdate(path, data),
      transaction: (updateFn) => mockTransaction(path, updateFn),
    }),
  };
}

beforeEach(() => jest.clearAllMocks());

// ─── callNextClient ────────────────────────────────────────────────────────────

describe('callNextClientHandler', () => {
  it('throws when event is not active', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'inactive' }) });
    await expect(callNextClientHandler(db, 'evt-1', 1)).rejects.toThrow(/no está activo/);
  });

  it('throws when no clients are waiting', async () => {
    const db = createDb();
    mockGet
      .mockResolvedValueOnce({ val: () => ({ status: 'active' }) })
      .mockResolvedValueOnce({ val: () => null });
    await expect(callNextClientHandler(db, 'evt-1', 1)).rejects.toThrow(/No hay clientes/);
  });

  it('throws when chair is already occupied (transaction aborts)', async () => {
    const db = createDb();
    mockGet
      .mockResolvedValueOnce({ val: () => ({ status: 'active' }) })
      .mockResolvedValueOnce({ val: () => ({
        'c1': { name: 'Ana', status: 'waiting', turn_number: 1, priority: false },
      }) });
    mockTransaction.mockResolvedValue({ committed: false });
    await expect(callNextClientHandler(db, 'evt-1', 1)).rejects.toThrow(/ya está ocupada/);
  });

  it('calls the priority client first', async () => {
    const db = createDb();
    mockGet
      .mockResolvedValueOnce({ val: () => ({ status: 'active' }) })
      .mockResolvedValueOnce({ val: () => ({
        'c1': { name: 'Regular',  status: 'waiting', turn_number: 1, priority: false },
        'c2': { name: 'Priority', status: 'waiting', turn_number: 5, priority: true },
      }) });
    mockTransaction.mockResolvedValue({ committed: true });
    mockUpdate.mockResolvedValue({});

    const result = await callNextClientHandler(db, 'evt-1', 1);

    expect(result.clientId).toBe('c2');
    expect(mockUpdate).toHaveBeenCalledWith(
      'queue/evt-1/c2',
      expect.objectContaining({ status: 'called' })
    );
  });

  it('calls the lowest turn_number among regular clients', async () => {
    const db = createDb();
    mockGet
      .mockResolvedValueOnce({ val: () => ({ status: 'active' }) })
      .mockResolvedValueOnce({ val: () => ({
        'c3': { name: 'Third',  status: 'waiting', turn_number: 3, priority: false },
        'c1': { name: 'First',  status: 'waiting', turn_number: 1, priority: false },
        'c2': { name: 'Second', status: 'waiting', turn_number: 2, priority: false },
      }) });
    mockTransaction.mockResolvedValue({ committed: true });
    mockUpdate.mockResolvedValue({});

    const result = await callNextClientHandler(db, 'evt-1', 1);
    expect(result.clientId).toBe('c1');
  });

  it('skips non-waiting clients', async () => {
    const db = createDb();
    mockGet
      .mockResolvedValueOnce({ val: () => ({ status: 'active' }) })
      .mockResolvedValueOnce({ val: () => ({
        'c1': { name: 'Called',  status: 'called',  turn_number: 1, priority: false },
        'c2': { name: 'Waiting', status: 'waiting', turn_number: 2, priority: false },
      }) });
    mockTransaction.mockResolvedValue({ committed: true });
    mockUpdate.mockResolvedValue({});

    const result = await callNextClientHandler(db, 'evt-1', 1);
    expect(result.clientId).toBe('c2');
  });

  it('sets called_at timestamp on the client record', async () => {
    const db = createDb();
    mockGet
      .mockResolvedValueOnce({ val: () => ({ status: 'active' }) })
      .mockResolvedValueOnce({ val: () => ({
        'c1': { name: 'Ana', status: 'waiting', turn_number: 1, priority: false },
      }) });
    mockTransaction.mockResolvedValue({ committed: true });
    mockUpdate.mockResolvedValue({});

    await callNextClientHandler(db, 'evt-1', 1);

    expect(mockUpdate).toHaveBeenCalledWith(
      'queue/evt-1/c1',
      expect.objectContaining({ 'timestamps/called_at': expect.any(Number) })
    );
  });

  it('calls sendChairReady with correct args after state change', async () => {
    const { sendChairReady } = require('./notifications');
    const db = createDb();
    mockGet
      .mockResolvedValueOnce({ val: () => ({ status: 'active' }) })
      .mockResolvedValueOnce({ val: () => ({
        'c1': { name: 'Ana', phone: '6621234567', status: 'waiting', turn_number: 1, priority: false },
      }) });
    mockTransaction.mockResolvedValue({ committed: true });
    mockUpdate.mockResolvedValue({});

    await callNextClientHandler(db, 'evt-1', 1);

    expect(sendChairReady).toHaveBeenCalledWith(
      db,
      'evt-1',
      'c1',
      expect.objectContaining({ name: 'Ana', phone: '6621234567' }),
      1
    );
  });
});

// ─── markAttending ─────────────────────────────────────────────────────────────

describe('markAttendingHandler', () => {
  it('throws when client does not exist', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => null });
    await expect(markAttendingHandler(db, 'evt-1', 'c1', 1)).rejects.toThrow(/no encontrado/);
  });

  it('throws on invalid transition (e.g. waiting -> attending)', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'waiting' }) });
    await expect(markAttendingHandler(db, 'evt-1', 'c1', 1)).rejects.toThrow();
  });

  it('updates status to attending with timestamp', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'called' }) });
    mockUpdate.mockResolvedValue({});

    await markAttendingHandler(db, 'evt-1', 'c1', 1);

    expect(mockUpdate).toHaveBeenCalledWith(
      'queue/evt-1/c1',
      expect.objectContaining({ status: 'attending', 'timestamps/attending_at': expect.any(Number) })
    );
  });
});

// ─── markAbsent ────────────────────────────────────────────────────────────────

describe('markAbsentHandler', () => {
  it('throws when client does not exist', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => null });
    await expect(markAbsentHandler(db, 'evt-1', 'c1', 1)).rejects.toThrow(/no encontrado/);
  });

  it('throws on invalid transition (e.g. attending -> absent)', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'attending' }) });
    await expect(markAbsentHandler(db, 'evt-1', 'c1', 1)).rejects.toThrow();
  });

  it('sets client absent and frees the chair atomically', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'called' }) });
    mockUpdate.mockResolvedValue({});

    await markAbsentHandler(db, 'evt-1', 'c1', 1);

    expect(mockUpdate).toHaveBeenCalledWith(
      '/',
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
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => null });
    await expect(markFinishedHandler(db, 'evt-1', 'c1', 1)).rejects.toThrow(/no encontrado/);
  });

  it('throws on invalid transition (e.g. called -> finished)', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'called' }) });
    await expect(markFinishedHandler(db, 'evt-1', 'c1', 1)).rejects.toThrow();
  });

  it('sets client finished and frees the chair atomically', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'attending' }) });
    mockUpdate.mockResolvedValue({});

    await markFinishedHandler(db, 'evt-1', 'c1', 1);

    expect(mockUpdate).toHaveBeenCalledWith(
      '/',
      expect.objectContaining({
        'queue/evt-1/c1/status': 'finished',
        'events/evt-1/chairs/1/status': 'available',
        'events/evt-1/chairs/1/current_client_id': null,
      })
    );
  });
});

// ─── reactivateClient ──────────────────────────────────────────────────────────

describe('reactivateClientHandler', () => {
  it('throws when client does not exist', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => null });
    await expect(reactivateClientHandler(db, 'evt-1', 'c1')).rejects.toThrow(/no encontrado/);
  });

  it('throws on invalid transition (e.g. waiting -> waiting)', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'waiting' }) });
    await expect(reactivateClientHandler(db, 'evt-1', 'c1')).rejects.toThrow();
  });

  it('throws on invalid transition (e.g. finished -> waiting)', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'finished' }) });
    await expect(reactivateClientHandler(db, 'evt-1', 'c1')).rejects.toThrow();
  });

  it('sets status to waiting with priority true and reactivated_at timestamp', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'absent', name: 'Ana', phone: '6621234567' }) });
    mockUpdate.mockResolvedValue({});

    await reactivateClientHandler(db, 'evt-1', 'c1');

    expect(mockUpdate).toHaveBeenCalledWith(
      'queue/evt-1/c1',
      expect.objectContaining({
        status: 'waiting',
        priority: true,
        'timestamps/reactivated_at': expect.any(Number),
      })
    );
  });

  it('calls sendReactivation with correct args after state change', async () => {
    const { sendReactivation } = require('./notifications');
    const db = createDb();
    const client = { status: 'absent', name: 'Ana', phone: '6621234567' };
    mockGet.mockResolvedValueOnce({ val: () => client });
    mockUpdate.mockResolvedValue({});

    await reactivateClientHandler(db, 'evt-1', 'c1');

    expect(sendReactivation).toHaveBeenCalledWith(
      db,
      'evt-1',
      'c1',
      expect.objectContaining({ name: 'Ana', phone: '6621234567' })
    );
  });
});
