import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase.js';
import EventToggleBar from '../components/EventToggleBar.jsx';
import ChairCard from '../components/ChairCard.jsx';
import WaitingList from '../components/WaitingList.jsx';
import AbsentList from '../components/AbsentList.jsx';
import LiveCounterBar from '../components/LiveCounterBar.jsx';

export default function AdminPanel() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const eventRef = ref(db, `events/${eventId}`);
    const unsubscribe = onValue(
      eventRef,
      (snapshot) => {
        setEvent(snapshot.val());
        setLoading(false);
      },
      (err) => {
        console.error('Event listener error:', err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [eventId]);

  useEffect(() => {
    const queueRef = ref(db, `queue/${eventId}`);
    const unsubscribe = onValue(
      queueRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        setClients(Object.entries(data).map(([id, c]) => ({ id, ...c })));
      },
      (err) => console.error('Queue listener error:', err.message)
    );
    return () => unsubscribe();
  }, [eventId]);

  if (loading) return <p style={{ padding: '24px' }}>Cargando...</p>;
  if (!event)  return <p style={{ padding: '24px' }}>Evento no encontrado.</p>;

  const waitingClients = clients.filter(c => c.status === 'waiting');
  const absentClients  = clients.filter(c => c.status === 'absent');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <EventToggleBar event={event} />
      <div style={{ display: 'flex', flex: '0 0 auto', padding: '0 4px' }}>
        <ChairCard chairNumber={1} chairData={event.chairs?.['1']} clients={clients} />
        <ChairCard chairNumber={2} chairData={event.chairs?.['2']} clients={clients} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <WaitingList clients={waitingClients} />
        <AbsentList clients={absentClients} />
      </div>
      <LiveCounterBar clients={clients} />
    </div>
  );
}
