const ITEMS = [
  { key: 'finished', label: 'Atendidos', testId: 'count-atendidos', color: '#4CAF50' },
  { key: 'waiting',  label: 'En espera', testId: 'count-en-espera',  color: '#FF69B4' },
  { key: 'absent',   label: 'Ausentes',  testId: 'count-ausentes',   color: '#FFD700' },
];

export default function LiveCounterBar({ clients }) {
  const counts = {
    finished: clients.filter(c => c.status === 'finished').length,
    waiting:  clients.filter(c => c.status === 'waiting').length,
    absent:   clients.filter(c => c.status === 'absent').length,
  };

  return (
    <div style={{
      display: 'flex',
      background: '#fff',
      flexShrink: 0,
      borderTop: '1px solid rgba(255,105,180,0.25)',
    }}>
      {ITEMS.map(({ key, label, testId, color }) => (
        <div key={key} style={{ flex: 1, textAlign: 'center', padding: '10px 0' }}>
          <div data-testid={testId} style={{ fontSize: '22px', fontWeight: 'bold', color }}>
            {counts[key]}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
