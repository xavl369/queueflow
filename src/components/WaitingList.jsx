import { sortWaitingList } from '../utils/sortWaitingList.js';

export default function WaitingList({ clients }) {
  const sorted = sortWaitingList(clients);

  if (sorted.length === 0) {
    return (
      <div style={{ padding: '20px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontSize: '14px' }}>
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
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          minHeight: '48px',
        }}>
          <span style={{ fontWeight: 'bold', color: '#FFD700', minWidth: '36px', fontSize: '14px' }}>
            {client.priority ? '#—' : `#${client.turn_number}`}
          </span>
          <span style={{ flex: 1, fontWeight: '500', color: '#111' }}>{client.name}</span>
          {client.priority && (
            <span style={{
              fontSize: '11px',
              background: 'rgba(255,215,0,0.15)',
              color: '#FFD700',
              padding: '2px 8px',
              borderRadius: '8px',
              fontWeight: 'bold',
              border: '1px solid rgba(255,215,0,0.3)',
            }}>
              ⭐ PRIORITARIA
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
