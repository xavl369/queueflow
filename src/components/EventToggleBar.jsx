import { useState } from 'react';

const C = { pink: '#FF69B4', gold: '#FFD700' };

const STATUS_LABELS = {
  active:   { text: 'ABIERTO',  bg: '#1a5c1a', color: '#4CAF50' },
  inactive: { text: 'INACTIVO', bg: '#2a2a2a', color: '#888' },
  closed:   { text: 'CERRADO',  bg: '#5c1a1a', color: '#F44336' },
};

const btnStyle = (bg, color = '#fff') => ({
  background: bg,
  color,
  border: 'none',
  borderRadius: '8px',
  padding: '6px 14px',
  fontWeight: 'bold',
  fontSize: '13px',
  cursor: 'pointer',
  minHeight: '36px',
  whiteSpace: 'nowrap',
});

export default function EventToggleBar({ event, onStatusChange, onLogout }) {
  const [confirming, setConfirming] = useState(false);
  const badge = STATUS_LABELS[event?.status] ?? STATUS_LABELS.inactive;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      background: '#fff',
      borderBottom: `1px solid rgba(255,105,180,0.25)`,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {onLogout && (
          <button
            onClick={onLogout}
            aria-label="Cerrar sesión"
            style={btnStyle('#eee', '#333')}
          >
            Salir
          </button>
        )}
        <span style={{ fontWeight: 'bold', fontSize: '15px', color: C.pink }}>
          ✨ {event?.name}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          background: badge.bg,
          color: badge.color,
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 'bold',
          letterSpacing: '0.06em',
        }}>
          {badge.text}
        </span>

        {event?.status === 'inactive' && (
          <button onClick={() => onStatusChange('active')} style={btnStyle('#1a5c1a', '#4CAF50')}>
            ABRIR
          </button>
        )}

        {event?.status === 'active' && !confirming && (
          <button onClick={() => setConfirming(true)} style={btnStyle('#5c1a1a', '#F44336')}>
            CERRAR
          </button>
        )}

        {confirming && (
          <>
            <button onClick={() => { setConfirming(false); onStatusChange('closed'); }} style={btnStyle('#F44336')}>
              CONFIRMAR
            </button>
            <button onClick={() => setConfirming(false)} style={btnStyle('#333')}>
              CANCELAR
            </button>
          </>
        )}
      </div>
    </div>
  );
}
