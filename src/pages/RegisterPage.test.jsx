import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../config/firebase.js', () => ({ db: {} }));

const { mockRef, mockOnValue, mockPush, mockRunTransaction } = vi.hoisted(() => ({
  mockRef: vi.fn(),
  mockOnValue: vi.fn(),
  mockPush: vi.fn(),
  mockRunTransaction: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  ref: mockRef,
  onValue: mockOnValue,
  push: mockPush,
  runTransaction: mockRunTransaction,
}));

import RegisterPage from './RegisterPage.jsx';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register/evt-123']}>
      <Routes>
        <Route path="/register/:eventId" element={<RegisterPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRef.mockReturnValue('mock-ref');
  });

  it('shows loading state while event data is loading', () => {
    mockOnValue.mockImplementation(() => () => {});
    renderPage();
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('shows not found message when event does not exist', () => {
    mockOnValue.mockImplementation((ref, cb) => {
      cb({ val: () => null });
      return () => {};
    });
    renderPage();
    expect(screen.getByText(/no encontrado/i)).toBeInTheDocument();
  });

  it('shows closed message when event status is inactive', () => {
    mockOnValue.mockImplementation((ref, cb) => {
      cb({ val: () => ({ status: 'inactive', name: 'Fiesta Test' }) });
      return () => {};
    });
    renderPage();
    expect(screen.getByText(/registro está cerrado/i)).toBeInTheDocument();
  });

  it('shows closed message when event status is closed', () => {
    mockOnValue.mockImplementation((ref, cb) => {
      cb({ val: () => ({ status: 'closed', name: 'Fiesta Test' }) });
      return () => {};
    });
    renderPage();
    expect(screen.getByText(/registro está cerrado/i)).toBeInTheDocument();
  });

  it('renders the registration form when event is active', () => {
    mockOnValue.mockImplementation((ref, cb) => {
      cb({ val: () => ({ status: 'active', name: 'Fiesta Test' }) });
      return () => {};
    });
    renderPage();
    expect(screen.getByPlaceholderText(/tu nombre/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/número de celular/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrarme/i })).toBeInTheDocument();
  });

  it('disables submit button when both fields are empty', () => {
    mockOnValue.mockImplementation((ref, cb) => {
      cb({ val: () => ({ status: 'active' }) });
      return () => {};
    });
    renderPage();
    expect(screen.getByRole('button', { name: /registrarme/i })).toBeDisabled();
  });

  it('disables submit button when phone has fewer than 10 digits', async () => {
    const user = userEvent.setup();
    mockOnValue.mockImplementation((ref, cb) => {
      cb({ val: () => ({ status: 'active' }) });
      return () => {};
    });
    renderPage();
    await user.type(screen.getByPlaceholderText(/tu nombre/i), 'Ana');
    await user.type(screen.getByPlaceholderText(/número de celular/i), '12345');
    expect(screen.getByRole('button', { name: /registrarme/i })).toBeDisabled();
  });

  it('enables submit button when name is filled and phone has 10 digits', async () => {
    const user = userEvent.setup();
    mockOnValue.mockImplementation((ref, cb) => {
      cb({ val: () => ({ status: 'active' }) });
      return () => {};
    });
    renderPage();
    await user.type(screen.getByPlaceholderText(/tu nombre/i), 'Ana');
    await user.type(screen.getByPlaceholderText(/número de celular/i), '6621234567');
    expect(screen.getByRole('button', { name: /registrarme/i })).toBeEnabled();
  });

  it('shows turn number on successful registration', async () => {
    const user = userEvent.setup();
    mockOnValue.mockImplementation((ref, cb) => {
      cb({ val: () => ({ status: 'active' }) });
      return () => {};
    });
    mockRunTransaction.mockResolvedValue({ snapshot: { val: () => 3 } });
    mockPush.mockResolvedValue({});

    renderPage();
    await user.type(screen.getByPlaceholderText(/tu nombre/i), 'Ana');
    await user.type(screen.getByPlaceholderText(/número de celular/i), '6621234567');
    await user.click(screen.getByRole('button', { name: /registrarme/i }));

    await waitFor(() => {
      expect(screen.getByText(/#3/)).toBeInTheDocument();
    });
  });

  it('writes correct data to Firebase on submit', async () => {
    const user = userEvent.setup();
    mockOnValue.mockImplementation((ref, cb) => {
      cb({ val: () => ({ status: 'active' }) });
      return () => {};
    });
    mockRunTransaction.mockResolvedValue({ snapshot: { val: () => 1 } });
    mockPush.mockResolvedValue({});

    renderPage();
    await user.type(screen.getByPlaceholderText(/tu nombre/i), 'Ana García');
    await user.type(screen.getByPlaceholderText(/número de celular/i), '6621234567');
    await user.click(screen.getByRole('button', { name: /registrarme/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        'mock-ref',
        expect.objectContaining({
          name: 'Ana García',
          phone: '6621234567',
          status: 'waiting',
          turn_number: 1,
          priority: false,
        })
      );
    });
  });

  it('shows error message when registration fails', async () => {
    const user = userEvent.setup();
    mockOnValue.mockImplementation((ref, cb) => {
      cb({ val: () => ({ status: 'active' }) });
      return () => {};
    });
    mockRunTransaction.mockRejectedValue(new Error('Network error'));

    renderPage();
    await user.type(screen.getByPlaceholderText(/tu nombre/i), 'Ana');
    await user.type(screen.getByPlaceholderText(/número de celular/i), '6621234567');
    await user.click(screen.getByRole('button', { name: /registrarme/i }));

    await waitFor(() => {
      expect(screen.getByText(/error al registrarte/i)).toBeInTheDocument();
    });
  });

  it('cleans up Firebase listener on unmount', () => {
    const unsubscribe = vi.fn();
    mockOnValue.mockImplementation((ref, cb) => {
      cb({ val: () => ({ status: 'active' }) });
      return unsubscribe;
    });
    const { unmount } = renderPage();
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
