import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, onValue, push, runTransaction } from 'firebase/database';
import { db } from '../config/firebase.js';

const COLORS = {
  brand: '#FF69B4',
  alert: '#F44336',
};

function SuccessScreen({ turnNumber, name }) {
  return (
    <div style={{ padding: '24px', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ color: COLORS.brand, fontSize: '2rem' }}>¡Listo! ✨</h1>
      <p style={{ fontSize: '1.2rem' }}>Hola, <strong>{name}</strong></p>
      <p style={{ fontSize: '3rem', fontWeight: 'bold', margin: '16px 0' }}>#{turnNumber}</p>
      <p>Tu número de turno. Te avisaremos por WhatsApp cuando tu silla esté lista.</p>
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

  if (eventLoading) return <p style={{ padding: '24px' }}>Cargando...</p>;
  if (!event) return <p style={{ padding: '24px' }}>Evento no encontrado.</p>;
  if (event.status !== 'active') return <p style={{ padding: '24px' }}>El registro está cerrado.</p>;
  if (turnNumber) return <SuccessScreen turnNumber={turnNumber} name={name} />;

  const isDisabled = submitting || !name.trim() || phone.length !== 10;

  return (
    <div style={{ padding: '24px', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ color: COLORS.brand, marginBottom: '24px' }}>Glitter Bar ✨</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Tu nombre"
          required
          style={{ fontSize: '16px', padding: '14px', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ccc' }}
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
          {submitting ? 'Registrando...' : 'Registrarme'}
        </button>
      </form>
    </div>
  );
}
