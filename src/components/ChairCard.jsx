const COLORS = {
  available: '#9E9E9E',
  called:    '#FFC107',
  attending: '#4CAF50',
};

export default function ChairCard({ chairNumber, chairData, clients }) {
  const status = chairData?.status ?? 'available';
  const currentClientId = chairData?.current_client_id ?? null;
  const currentClient = currentClientId
    ? clients.find(c => c.id === currentClientId)
    : null;

  const cardColor = status === 'available'
    ? COLORS.available
    : COLORS[currentClient?.status] ?? COLORS.called;

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
      gap: '4px',
    }}>
      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Silla {chairNumber}</span>
      {status === 'available'
        ? <span style={{ fontSize: '13px' }}>Disponible</span>
        : <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{currentClient?.name ?? '—'}</span>
      }
    </div>
  );
}
