const STATUS_LABELS = {
  active:   { text: 'ABIERTO',  bg: '#4CAF50' },
  inactive: { text: 'INACTIVO', bg: '#9E9E9E' },
  closed:   { text: 'CERRADO',  bg: '#F44336' },
};

export default function EventToggleBar({ event }) {
  const badge = STATUS_LABELS[event?.status] ?? STATUS_LABELS.inactive;

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
    </div>
  );
}
