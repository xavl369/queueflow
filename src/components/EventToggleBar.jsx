import { useState } from 'react';

const STATUS_LABELS = {
  active:   { text: 'ABIERTO',  bg: '#4CAF50' },
  inactive: { text: 'INACTIVO', bg: '#9E9E9E' },
  closed:   { text: 'CERRADO',  bg: '#F44336' },
};

export default function EventToggleBar({ event, onStatusChange }) {
  const [confirming, setConfirming] = useState(false);
  const badge = STATUS_LABELS[event?.status] ?? STATUS_LABELS.inactive;

  function handleCerrarClick() {
    setConfirming(true);
  }

  function handleConfirm() {
    setConfirming(false);
    onStatusChange('closed');
  }

  function handleCancel() {
    setConfirming(false);
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: '#1a1a1a',
      color: '#fff',
      flexShrink: 0,
    }}>
      <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{event?.name}</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          background: badge.bg,
          color: '#fff',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {badge.text}
        </span>

        {event?.status === 'inactive' && (
          <button
            onClick={() => onStatusChange('active')}
            style={{
              background: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            ABRIR
          </button>
        )}

        {event?.status === 'active' && !confirming && (
          <button
            onClick={handleCerrarClick}
            style={{
              background: '#F44336',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            CERRAR
          </button>
        )}

        {confirming && (
          <>
            <button
              onClick={handleConfirm}
              style={{
                background: '#F44336',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              CONFIRMAR
            </button>
            <button
              onClick={handleCancel}
              style={{
                background: '#757575',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              CANCELAR
            </button>
          </>
        )}
      </div>
    </div>
  );
}
