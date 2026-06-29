import { useState } from 'react';
import { isCallButtonDisabled } from '../utils/isCallButtonDisabled.js';

const STATUS_BG = {
  available: '#f5f5f5',
  called:    '#fffbea',
  attending: '#f0fff0',
};

const STATUS_ACCENT = {
  available: '#555',
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
  green:  { background: '#2e7d32' },
  amber:  { background: '#e65100' },
  red:    { background: '#b71c1c' },
  gray:   { background: 'rgba(0,0,0,0.06)', cursor: 'not-allowed', color: 'rgba(0,0,0,0.3)' },
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

  const clientStatus = currentClient?.status ?? 'called';
  const bg     = status === 'available' ? STATUS_BG.available : (STATUS_BG[clientStatus] ?? STATUS_BG.called);
  const accent = status === 'available' ? STATUS_ACCENT.available : (STATUS_ACCENT[clientStatus] ?? STATUS_ACCENT.called);

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
      margin: '6px',
      padding: '14px',
      borderRadius: '12px',
      background: bg,
      border: `1px solid ${accent}44`,
      color: '#111',
      minHeight: '80px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <span style={{ fontWeight: 'bold', fontSize: '13px', color: accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Silla {chairNumber}
      </span>

      {status === 'available'
        ? <span style={{ fontSize: '13px', color: 'rgba(0,0,0,0.35)' }}>Disponible</span>
        : <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#111' }}>{currentClient?.name ?? '—'}</span>
      }

      {error && (
        <span style={{ fontSize: '12px', color: '#ef9a9a', fontWeight: 'bold' }}>
          {error}
        </span>
      )}

      {status === 'available' && onCallNext && (
        <ActionButton
          label={loading ? 'Llamando...' : 'Llamar'}
          disabled={callDisabled}
          style={BTN.green}
          onClick={() => runAction(onCallNext)}
        />
      )}

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
