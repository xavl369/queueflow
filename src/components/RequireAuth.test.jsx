import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../config/firebase.js', () => ({ auth: {} }));

const { mockOnAuthStateChanged } = vi.hoisted(() => ({
  mockOnAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mockOnAuthStateChanged,
}));

import RequireAuth from './RequireAuth.jsx';

describe('RequireAuth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading while checking auth state', () => {
    mockOnAuthStateChanged.mockImplementation(() => () => {});
    render(
      <MemoryRouter>
        <RequireAuth><div>Content</div></RequireAuth>
      </MemoryRouter>
    );
    expect(screen.getByText(/verificando/i)).toBeInTheDocument();
  });

  it('redirects to /login when user is not authenticated', () => {
    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      cb(null);
      return () => {};
    });
    render(
      <MemoryRouter initialEntries={['/admin/evt-123']}>
        <Routes>
          <Route path="/admin/:eventId" element={
            <RequireAuth><div>Protected</div></RequireAuth>
          } />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: '123', email: 'admin@test.com' });
      return () => {};
    });
    render(
      <MemoryRouter>
        <RequireAuth><div>Protected Content</div></RequireAuth>
      </MemoryRouter>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('cleans up auth listener on unmount', () => {
    const unsubscribe = vi.fn();
    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: '123' });
      return unsubscribe;
    });
    const { unmount } = render(
      <MemoryRouter>
        <RequireAuth><div>Content</div></RequireAuth>
      </MemoryRouter>
    );
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
