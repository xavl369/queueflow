jest.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
  },
}));

const { setEventStatusHandler } = require('./eventToggle');

const mockGet    = jest.fn();
const mockUpdate = jest.fn();

function createDb() {
  return {
    ref: (path) => ({
      get:    () => mockGet(path),
      update: (data) => mockUpdate(path, data),
    }),
  };
}

beforeEach(() => jest.clearAllMocks());

describe('setEventStatusHandler', () => {
  it('transitions inactive -> active and writes to DB', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'inactive', name: 'Fiesta' }) });
    mockUpdate.mockResolvedValue({});

    const result = await setEventStatusHandler(db, 'evt-1', 'active');

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      'events/evt-1',
      expect.objectContaining({ status: 'active', updated_at: expect.any(Number) })
    );
  });

  it('transitions active -> closed and writes to DB', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'active', name: 'Fiesta' }) });
    mockUpdate.mockResolvedValue({});

    const result = await setEventStatusHandler(db, 'evt-1', 'closed');

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      'events/evt-1',
      expect.objectContaining({ status: 'closed', updated_at: expect.any(Number) })
    );
  });

  it('throws when event does not exist', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => null });

    await expect(setEventStatusHandler(db, 'evt-1', 'active')).rejects.toThrow(/no encontrado/);
  });

  it('throws on invalid transition: closed -> active', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'closed' }) });

    await expect(setEventStatusHandler(db, 'evt-1', 'active')).rejects.toThrow(/Cannot transition/);
  });

  it('throws on invalid transition: inactive -> closed', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'inactive' }) });

    await expect(setEventStatusHandler(db, 'evt-1', 'closed')).rejects.toThrow(/Cannot transition/);
  });

  it('throws on invalid transition: active -> inactive', async () => {
    const db = createDb();
    mockGet.mockResolvedValueOnce({ val: () => ({ status: 'active' }) });

    await expect(setEventStatusHandler(db, 'evt-1', 'inactive')).rejects.toThrow(/Cannot transition/);
  });
});
