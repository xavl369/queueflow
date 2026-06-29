import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../config/firebase.js';

const C = {
  bg:      '#fff',
  surface: '#f7f7f7',
  pink:    '#FF69B4',
  gold:    '#e6a800',
  alert:   '#F44336',
  muted:   'rgba(0,0,0,0.4)',
  border:  'rgba(255,105,180,0.35)',
};

const INPUT_STYLE = {
  fontSize: '16px',
  padding: '14px',
  width: '100%',
  borderRadius: '10px',
  border: `1px solid ${C.border}`,
  background: C.surface,
  color: '#111',
  outline: 'none',
};

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
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '32px 24px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ color: C.pink }}>Glitter Bar ✨</h1>
          <p style={{ color: '#4CAF50', fontWeight: 'bold' }}>Sesión iniciada correctamente.</p>
          <p style={{ color: C.muted, fontSize: '0.9rem' }}>
            No hay eventos creados todavía. Crea un evento en la consola de Firebase y navega a{' '}
            <code style={{ color: C.gold }}>/admin/EVENT_ID</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: '32px 24px', maxWidth: '400px', width: '100%' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>✨</div>
          <h1 style={{ color: C.pink, fontSize: '1.8rem', margin: '0 0 4px' }}>Glitter Bar</h1>
          <p style={{ color: C.muted, margin: 0, fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Panel de administración
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            required
            style={INPUT_STYLE}
          />
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              style={{ ...INPUT_STYLE, paddingRight: '48px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                color: C.muted, lineHeight: 1,
              }}
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
          {error && <p style={{ color: C.alert, margin: 0, fontSize: '0.9rem' }}>{error}</p>}
          <button
            type="submit"
            disabled={isDisabled}
            style={{
              minHeight: '52px',
              padding: '12px 24px',
              width: '100%',
              background: isDisabled ? 'rgba(255,105,180,0.15)' : `linear-gradient(135deg, ${C.pink}, #e91e8c)`,
              color: isDisabled ? 'rgba(255,105,180,0.5)' : '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              letterSpacing: '0.04em',
              boxShadow: isDisabled ? 'none' : `0 4px 20px ${C.pink}44`,
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
