import { sortWaitingList } from '../utils/sortWaitingList.js';

export default function WaitingList({ clients }) {
  const sorted = sortWaitingList(clients);

  if (sorted.length === 0) {
    return (
      <div style={{ padding: '16px', color: '#999', textAlign: 'center' }}>
        Nadie en espera
      </div>
    );
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: '0 8px' }}>
      {sorted.map(client => (
        <li key={client.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 8px',
          borderBottom: '1px solid #eee',
          minHeight: '48px',
        }}>
          <span style={{ fontWeight: 'bold', color: '#555', minWidth: '32px' }}>
            {client.priority ? '#—' : `#${client.turn_number}`}
          </span>
          <span style={{ flex: 1, fontWeight: '500' }}>{client.name}</span>
          {client.priority && (
            <span style={{
              fontSize: '11px',
              background: '#FFD700',
              color: '#333',
              padding: '2px 6px',
              borderRadius: '8px',
              fontWeight: 'bold',
            }}>
              ⭐ PRIORITARIA
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
