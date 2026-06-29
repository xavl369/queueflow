import { useState } from 'react';

export default function AbsentList({ clients, onReactivate }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ margin: '6px 8px' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          minHeight: '44px',
          padding: '10px 14px',
          background: '#f5f5f5',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'rgba(0,0,0,0.5)',
        }}
      >
        <span>Ausentes ({clients.length})</span>
        <span style={{ fontSize: '12px' }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0 }}>
          {clients.map(client => (
            <li key={client.id} style={{
              padding: '10px 8px',
              borderBottom: '1px solid rgba(0,0,0,0.07)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ color: 'rgba(0,0,0,0.3)', minWidth: '36px', fontSize: '14px' }}>
                #{client.turn_number}
              </span>
              <span style={{ flex: 1, fontWeight: '500', color: '#111' }}>{client.name}</span>
              <button
                onClick={() => onReactivate(client.id)}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255,215,0,0.12)',
                  color: '#FFD700',
                  border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  minHeight: '34px',
                }}
              >
                REACTIVAR
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
