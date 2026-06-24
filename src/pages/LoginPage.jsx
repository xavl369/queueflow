import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../config/firebase.js';

const COLORS = { brand: '#FF69B4', alert: '#F44336' };

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('Login error:', err.code || err.message);
      setError('Credenciales incorrectas. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    // Sign-in succeeded — navigate to original destination or find the first event
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    try {
      const snap = await get(ref(db, 'events'));
      const events = snap.val() || {};
      const eventId = Object.keys(events)[0];
      if (eventId) {
        navigate(`/admin/${eventId}`, { replace: true });
      } else {
        setLoggedIn(true);
      }
    } catch {
      setLoggedIn(true);
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = loading || !email.trim() || !password.trim();

  if (loggedIn) {
    return (
      <div style={{ padding: '24px', maxWidth: '400px', margin: '0 auto' }}>
        <h1 style={{ color: COLORS.brand }}>Glitter Bar ✨</h1>
        <p style={{ color: '#4CAF50', fontWeight: 'bold' }}>Sesión iniciada correctamente.</p>
        <p style={{ color: '#666' }}>No hay eventos creados todavía. Crea un evento en la consola de Firebase y navega a <code>/admin/EVENT_ID</code>.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ color: COLORS.brand }}>Glitter Bar ✨</h1>
      <p style={{ color: '#666' }}>Panel de administración</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          required
          style={{ fontSize: '16px', padding: '14px', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            style={{ fontSize: '16px', padding: '14px', paddingRight: '48px', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ccc' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#888', lineHeight: 1 }}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
        {error && <p style={{ color: COLORS.alert, margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={isDisabled}
          style={{
            minHeight: '48px',
            padding: '12px 24px',
            width: '100%',
            background: isDisabled ? '#ccc' : COLORS.brand,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
