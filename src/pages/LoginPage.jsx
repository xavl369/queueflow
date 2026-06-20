import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase.js';

const COLORS = { brand: '#FF69B4', alert: '#F44336' };

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(from, { replace: true });
    } catch {
      setError('Credenciales incorrectas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = loading || !email.trim() || !password.trim();

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
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
          style={{ fontSize: '16px', padding: '14px', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ccc' }}
        />
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
