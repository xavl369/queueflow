import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../config/firebase.js', () => ({ db: {} }));

const { mockRef, mockOnValue } = vi.hoisted(() => ({
  mockRef: vi.fn(),
  mockOnValue: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  ref: mockRef,
  onValue: mockOnValue,
}));

import AdminPanel from './AdminPanel.jsx';

const mockEvent = {
  name: 'Fiesta Test',
  status: 'active',
  chairs: {
    '1': { status: 'available', current_client_id: null },
    '2': { status: 'available', current_client_id: null },
  },
};

const mockQueueData = {
  'c1': { name: 'Ana García', phone: '6621111111', status: 'waiting', turn_number: 1, priority: false, timestamps: { registered_at: Date.now() } },
  'c2': { name: 'Luis Pérez', phone: '6622222222', status: 'waiting', turn_number: 2, priority: false, timestamps: { registered_at: Date.now() } },
};

function setupMocks({ event = mockEvent, queue = mockQueueData } = {}) {
  mockRef.mockReturnValue('mock-ref');
  let callCount = 0;
  mockOnValue.mockImplementation((ref, cb) => {
    callCount++;
    cb({ val: () => callCount === 1 ? event : queue });
    return () => {};
  });
}

function renderPanel() {
  return render(
    <MemoryRouter initialEntries={['/admin/evt-123']}>
      <Routes>
        <Route path="/admin/:eventId" element={<AdminPanel />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading while data is loading', () => {
    mockRef.mockReturnValue('mock-ref');
    mockOnValue.mockImplementation(() => () => {});
    renderPanel();
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('shows event not found when event is null', () => {
    setupMocks({ event: null });
    renderPanel();
    expect(screen.getByText(/no encontrado/i)).toBeInTheDocument();
  });

  it('renders both chair cards', () => {
    setupMocks();
    renderPanel();
    expect(screen.getByText(/silla 1/i)).toBeInTheDocument();
    expect(screen.getByText(/silla 2/i)).toBeInTheDocument();
  });

  it('renders the event name', () => {
    setupMocks();
    renderPanel();
    expect(screen.getByText('Fiesta Test')).toBeInTheDocument();
  });

  it('renders waiting clients in the list', () => {
    setupMocks();
    renderPanel();
    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('Luis Pérez')).toBeInTheDocument();
  });

  it('renders the live counter bar', () => {
    setupMocks();
    renderPanel();
    expect(screen.getByText(/en espera/i)).toBeInTheDocument();
  });

  it('sets up two real-time listeners', () => {
    setupMocks();
    renderPanel();
    expect(mockOnValue).toHaveBeenCalledTimes(2);
  });

  it('cleans up both listeners on unmount', () => {
    const unsub1 = vi.fn();
    const unsub2 = vi.fn();
    let callCount = 0;
    mockRef.mockReturnValue('mock-ref');
    mockOnValue.mockImplementation((ref, cb) => {
      const isFirst = callCount === 0;
      callCount++;
      cb({ val: () => isFirst ? mockEvent : mockQueueData });
      return isFirst ? unsub1 : unsub2;
    });
    const { unmount } = renderPanel();
    unmount();
    expect(unsub1).toHaveBeenCalled();
    expect(unsub2).toHaveBeenCalled();
  });
});
