import { useState } from 'react';
import { isCallButtonDisabled } from '../utils/isCallButtonDisabled.js';

const COLORS = {
  available: '#9E9E9E',
  called:    '#FFC107',
  attending: '#4CAF50',
};

const BTN = {
  base: {
    padding: '10px 0',
    fontSize: '15px',
    fontWeight: 'bold',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    minHeight: '48px',
    flex: 1,
    color: '#fff',
  },
  green:  { background: '#388E3C' },
  amber:  { background: '#F57F17' },
  red:    { background: '#C62828' },
  gray:   { background: 'rgba(0,0,0,0.25)', cursor: 'not-allowed' },
};

function ActionButton({ label, onClick, style, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...BTN.base, ...(disabled ? BTN.gray : style) }}
    >
      {label}
    </button>
  );
}

export default function ChairCard({
  chairNumber,
  chairData,
  clients,
  eventStatus,
  waitingClients = [],
  onCallNext,
  onMarkAttending,
  onMarkAbsent,
  onMarkFinished,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const status = chairData?.status ?? 'available';
  const currentClientId = chairData?.current_client_id ?? null;
  const currentClient = currentClientId ? clients.find(c => c.id === currentClientId) : null;

  const cardColor = status === 'available'
    ? COLORS.available
    : COLORS[currentClient?.status] ?? COLORS.called;

  async function runAction(fn) {
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err.message || 'Error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const callDisabled = isCallButtonDisabled(chairData, waitingClients, eventStatus) || loading;

  return (
    <div style={{
      flex: 1,
      margin: '8px',
      padding: '16px',
      borderRadius: '12px',
      background: cardColor,
      color: '#fff',
      minHeight: '80px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Silla {chairNumber}</span>

      {status === 'available'
        ? <span style={{ fontSize: '13px' }}>Disponible</span>
        : <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{currentClient?.name ?? '—'}</span>
      }

      {error && (
        <span style={{ fontSize: '12px', color: '#FFCDD2', fontWeight: 'bold' }}>
          Error: {error}
        </span>
      )}

      {/* LLAMAR — shown when chair is available */}
      {status === 'available' && onCallNext && (
        <ActionButton
          label={loading ? 'Llamando...' : 'Llamar'}
          disabled={callDisabled}
          style={BTN.green}
          onClick={() => runAction(onCallNext)}
        />
      )}

      {/* LLEGO / NO VINO — shown when current client is called */}
      {status === 'occupied' && currentClient?.status === 'called' && (
        <div style={{ display: 'flex', gap: '8px' }}>
          {onMarkAttending && (
            <ActionButton
              label={loading ? '...' : 'Llegó ✓'}
              disabled={loading}
              style={BTN.green}
              onClick={() => runAction(() => onMarkAttending(currentClientId))}
            />
          )}
          {onMarkAbsent && (
            <ActionButton
              label={loading ? '...' : 'No vino ✗'}
              disabled={loading}
              style={BTN.red}
              onClick={() => runAction(() => onMarkAbsent(currentClientId))}
            />
          )}
        </div>
      )}

      {/* FINALIZADO — shown when current client is attending */}
      {status === 'occupied' && currentClient?.status === 'attending' && onMarkFinished && (
        <ActionButton
          label={loading ? '...' : 'Finalizado'}
          disabled={loading}
          style={BTN.amber}
          onClick={() => runAction(() => onMarkFinished(currentClientId))}
        />
      )}
    </div>
  );
}
