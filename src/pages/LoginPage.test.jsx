import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../config/firebase.js', () => ({ auth: {} }));

const { mockSignIn } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: mockSignIn,
}));

import LoginPage from './LoginPage.jsx';

function renderLogin(from = '/admin/evt-123') {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: from } } }]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/:eventId" element={<div>Admin Panel</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders email and password inputs', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/correo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/contraseña/i)).toBeInTheDocument();
  });

  it('disables submit button when fields are empty', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeDisabled();
  });

  it('enables submit button when both fields are filled', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText(/correo/i), 'admin@test.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    expect(screen.getByRole('button', { name: /entrar/i })).toBeEnabled();
  });

  it('calls signInWithEmailAndPassword with correct credentials', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ user: { uid: '123' } });
    renderLogin();
    await user.type(screen.getByPlaceholderText(/correo/i), 'admin@test.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(mockSignIn).toHaveBeenCalledWith({}, 'admin@test.com', 'password123');
  });

  it('redirects to the original destination after login', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ user: { uid: '123' } });
    renderLogin('/admin/evt-123');
    await user.type(screen.getByPlaceholderText(/correo/i), 'admin@test.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });
  });

  it('shows error message on failed login', async () => {
    const user = userEvent.setup();
    mockSignIn.mockRejectedValue(new Error('auth/wrong-password'));
    renderLogin();
    await user.type(screen.getByPlaceholderText(/correo/i), 'admin@test.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during sign-in', async () => {
    const user = userEvent.setup();
    mockSignIn.mockImplementation(() => new Promise(() => {}));
    renderLogin();
    await user.type(screen.getByPlaceholderText(/correo/i), 'admin@test.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled();
  });
});
