import { useState } from 'react';

export default function AbsentList({ clients }) {
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
              padding: '12px 8px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ color: '#999' }}>#{client.turn_number}</span>
              <span>{client.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
