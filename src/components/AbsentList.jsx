import { useState } from 'react';

export default function AbsentList({ clients, onReactivate }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ margin: '8px' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          minHeight: '48px',
          padding: '12px 16px',
          background: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Ausentes ({clients.length})</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0 }}>
          {clients.map(client => (
            <li key={client.id} style={{
              padding: '10px 8px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ color: '#999', minWidth: '32px' }}>#{client.turn_number}</span>
              <span style={{ flex: 1, fontWeight: '500' }}>{client.name}</span>
              <button
                onClick={() => onReactivate(client.id)}
                style={{
                  padding: '6px 12px',
                  background: '#FFD700',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  minHeight: '36px',
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
