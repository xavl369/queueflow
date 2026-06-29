import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, onValue, push, runTransaction } from 'firebase/database';
import { db } from '../config/firebase.js';

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

const SOCIAL_LINKS = [
  {
    href: 'https://www.instagram.com/glitterbarhmoofficial/',
    label: 'Instagram',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    href: 'https://www.facebook.com/profile.php?id=61579532096684',
    label: 'Facebook',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    href: 'https://www.youtube.com/@GlitterBarHmoOfficial',
    label: 'YouTube',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
];

function SocialFooter() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '36px' }}>
      {SOCIAL_LINKS.map(({ href, label, icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          style={{ color: C.muted, display: 'flex', alignItems: 'center', textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = C.pink}
          onMouseLeave={e => e.currentTarget.style.color = C.muted}
        >
          {icon}
        </a>
      ))}
    </div>
  );
}

function SuccessScreen({ turnNumber, name }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: '32px 24px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>✨</div>
        <h1 style={{ color: C.pink, fontSize: '2rem', margin: '0 0 16px' }}>¡Listo!</h1>
        <p style={{ fontSize: '1.1rem', color: 'rgba(0,0,0,0.7)', margin: '0 0 8px' }}>
          Hola, <strong style={{ color: '#111' }}>{name}</strong>
        </p>
        <div style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          color: C.gold,
          margin: '24px 0',
          textShadow: `0 0 20px ${C.gold}55`,
        }}>
          #{turnNumber}
        </div>
        <p style={{ color: C.muted, fontSize: '0.95rem', lineHeight: 1.6 }}>
          Tu número de turno. Te avisaremos por mensaje de texto cuando tu silla esté lista.
        </p>
        <SocialFooter />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [turnNumber, setTurnNumber] = useState(null);

  useEffect(() => {
    const eventRef = ref(db, `events/${eventId}`);
    const unsubscribe = onValue(
      eventRef,
      (snapshot) => {
        setEvent(snapshot.val());
        setEventLoading(false);
      },
      (err) => {
        console.error('Firebase error:', err.message);
        setError(`Error de conexión: ${err.message}`);
        setEventLoading(false);
      }
    );
    return () => unsubscribe();
  }, [eventId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await Promise.race([
        (async () => {
          const counterRef = ref(db, `events/${eventId}/turn_counter`);
          const result = await runTransaction(counterRef, (current) => (current || 0) + 1);
          const turn = result.snapshot.val();

          await push(ref(db, `queue/${eventId}`), {
            name: name.trim(),
            phone: phone.trim(),
            status: 'waiting',
            turn_number: turn,
            priority: false,
            timestamps: { registered_at: Date.now() },
          });

          setTurnNumber(turn);
        })(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 8000)
        ),
      ]);
    } catch {
      setError('Error al registrarte. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  const statusPage = (msg) => (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.muted, padding: '24px' }}>{msg}</p>
    </div>
  );

  if (eventLoading) return statusPage('Cargando...');
  if (!event) return statusPage('Evento no encontrado.');
  if (event.status !== 'active') return statusPage('El registro está cerrado.');
  if (turnNumber) return <SuccessScreen turnNumber={turnNumber} name={name} />;

  const isDisabled = submitting || !name.trim() || phone.length !== 10;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: '32px 24px', maxWidth: '400px', width: '100%' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>✨</div>
          <h1 style={{
            color: C.pink,
            fontSize: '2rem',
            margin: '0 0 4px',
            letterSpacing: '0.02em',
          }}>
            Glitter Bar
          </h1>
          <p style={{ color: C.gold, margin: 0, fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Hmo Official
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
            required
            style={INPUT_STYLE}
          />
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{10}"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="Número de celular (10 dígitos)"
            required
            style={INPUT_STYLE}
          />
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
            {submitting ? 'Registrando...' : 'Registrarme'}
          </button>
        </form>

        <SocialFooter />
      </div>
    </div>
  );
}
