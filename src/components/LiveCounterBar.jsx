export default function LiveCounterBar({ clients }) {
  const atendidos = clients.filter(c => c.status === 'finished').length;
  const enEspera  = clients.filter(c => c.status === 'waiting').length;
  const ausentes  = clients.filter(c => c.status === 'absent').length;

  const item = (label, count, testId) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '8px 0' }}>
      <div data-testid={testId} style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>
        {count}
      </div>
      <div style={{ fontSize: '11px', color: '#ccc', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      background: '#1a1a1a',
      flexShrink: 0,
      borderTop: '1px solid #333',
    }}>
      {item('Atendidos', atendidos, 'count-atendidos')}
      {item('En espera', enEspera, 'count-en-espera')}
      {item('Ausentes',  ausentes, 'count-ausentes')}
    </div>
  );
}
