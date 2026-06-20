import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChairCard from './ChairCard.jsx';

const clients = [
  { id: 'c1', name: 'Ana García',  status: 'called',    turn_number: 1, priority: false },
  { id: 'c2', name: 'Luis Pérez',  status: 'attending', turn_number: 2, priority: false },
];
const waiting = [{ id: 'c3', status: 'waiting', turn_number: 3, priority: false }];

// ─── display (existing) ───────────────────────────────────────────────────────

describe('ChairCard — display', () => {
  it('shows the chair number', () => {
    render(<ChairCard chairNumber={1} chairData={{ status: 'available', current_client_id: null }} clients={[]} />);
    expect(screen.getByText(/silla 1/i)).toBeInTheDocument();
  });

  it('shows Disponible when chair is available', () => {
    render(<ChairCard chairNumber={1} chairData={{ status: 'available', current_client_id: null }} clients={[]} />);
    expect(screen.getByText(/disponible/i)).toBeInTheDocument();
  });

  it('shows current client name when chair is occupied', () => {
    render(<ChairCard chairNumber={1} chairData={{ status: 'occupied', current_client_id: 'c1' }} clients={clients} />);
    expect(screen.getByText('Ana García')).toBeInTheDocument();
  });

  it('shows Silla 2 for chair number 2', () => {
    render(<ChairCard chairNumber={2} chairData={{ status: 'available', current_client_id: null }} clients={[]} />);
    expect(screen.getByText(/silla 2/i)).toBeInTheDocument();
  });

  it('renders without crashing when chairData is null', () => {
    render(<ChairCard chairNumber={1} chairData={null} clients={[]} />);
    expect(screen.getByText(/silla 1/i)).toBeInTheDocument();
    expect(screen.getByText(/disponible/i)).toBeInTheDocument();
  });
});

// ─── LLAMAR button ────────────────────────────────────────────────────────────

describe('ChairCard — LLAMAR button', () => {
  it('shows LLAMAR when chair is available', () => {
    render(
      <ChairCard chairNumber={1} chairData={{ status: 'available', current_client_id: null }}
        clients={[]} eventStatus="active" waitingClients={waiting} onCallNext={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /llamar/i })).toBeInTheDocument();
  });

  it('LLAMAR is disabled when no waiting clients', () => {
    render(
      <ChairCard chairNumber={1} chairData={{ status: 'available', current_client_id: null }}
        clients={[]} eventStatus="active" waitingClients={[]} onCallNext={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /llamar/i })).toBeDisabled();
  });

  it('LLAMAR is disabled when event is not active', () => {
    render(
      <ChairCard chairNumber={1} chairData={{ status: 'available', current_client_id: null }}
        clients={[]} eventStatus="inactive" waitingClients={waiting} onCallNext={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /llamar/i })).toBeDisabled();
  });

  it('calls onCallNext when LLAMAR is clicked', async () => {
    const user = userEvent.setup();
    const onCallNext = vi.fn().mockResolvedValue({});
    render(
      <ChairCard chairNumber={1} chairData={{ status: 'available', current_client_id: null }}
        clients={[]} eventStatus="active" waitingClients={waiting} onCallNext={onCallNext} />
    );
    await user.click(screen.getByRole('button', { name: /llamar/i }));
    expect(onCallNext).toHaveBeenCalled();
  });

  it('shows loading state while LLAMAR is in progress', async () => {
    const user = userEvent.setup();
    const onCallNext = vi.fn(() => new Promise(() => {}));
    render(
      <ChairCard chairNumber={1} chairData={{ status: 'available', current_client_id: null }}
        clients={[]} eventStatus="active" waitingClients={waiting} onCallNext={onCallNext} />
    );
    await user.click(screen.getByRole('button', { name: /llamar/i }));
    expect(screen.getByRole('button', { name: /llamando/i })).toBeDisabled();
  });

  it('shows error when LLAMAR fails', async () => {
    const user = userEvent.setup();
    const onCallNext = vi.fn().mockRejectedValue(new Error('Sin conexión'));
    render(
      <ChairCard chairNumber={1} chairData={{ status: 'available', current_client_id: null }}
        clients={[]} eventStatus="active" waitingClients={waiting} onCallNext={onCallNext} />
    );
    await user.click(screen.getByRole('button', { name: /llamar/i }));
    await waitFor(() => expect(screen.getByText(/error/i)).toBeInTheDocument());
  });
});

// ─── LLEGO / NO VINO buttons ─────────────────────────────────────────────────

describe('ChairCard — LLEGO / NO VINO buttons', () => {
  it('shows LLEGO and NO VINO when current client is in called state', () => {
    render(
      <ChairCard chairNumber={1} chairData={{ status: 'occupied', current_client_id: 'c1' }}
        clients={clients} eventStatus="active" waitingClients={[]}
        onMarkAttending={vi.fn()} onMarkAbsent={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /lleg[oó]/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no vino/i })).toBeInTheDocument();
  });

  it('calls onMarkAttending with clientId when LLEGO is clicked', async () => {
    const user = userEvent.setup();
    const onMarkAttending = vi.fn().mockResolvedValue({});
    render(
      <ChairCard chairNumber={1} chairData={{ status: 'occupied', current_client_id: 'c1' }}
        clients={clients} eventStatus="active" waitingClients={[]}
        onMarkAttending={onMarkAttending} onMarkAbsent={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: /lleg[oó]/i }));
    expect(onMarkAttending).toHaveBeenCalledWith('c1');
  });

  it('calls onMarkAbsent with clientId when NO VINO is clicked', async () => {
    const user = userEvent.setup();
    const onMarkAbsent = vi.fn().mockResolvedValue({});
    render(
      <ChairCard chairNumber={1} chairData={{ status: 'occupied', current_client_id: 'c1' }}
        clients={clients} eventStatus="active" waitingClients={[]}
        onMarkAttending={vi.fn()} onMarkAbsent={onMarkAbsent} />
    );
    await user.click(screen.getByRole('button', { name: /no vino/i }));
    expect(onMarkAbsent).toHaveBeenCalledWith('c1');
  });
});

// ─── FINALIZADO button ────────────────────────────────────────────────────────

describe('ChairCard — FINALIZADO button', () => {
  it('shows FINALIZADO when current client is attending', () => {
    render(
      <ChairCard chairNumber={1} chairData={{ status: 'occupied', current_client_id: 'c2' }}
        clients={clients} eventStatus="active" waitingClients={[]}
        onMarkFinished={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /finalizado/i })).toBeInTheDocument();
  });

  it('calls onMarkFinished with clientId when FINALIZADO is clicked', async () => {
    const user = userEvent.setup();
    const onMarkFinished = vi.fn().mockResolvedValue({});
    render(
      <ChairCard chairNumber={1} chairData={{ status: 'occupied', current_client_id: 'c2' }}
        clients={clients} eventStatus="active" waitingClients={[]}
        onMarkFinished={onMarkFinished} />
    );
    await user.click(screen.getByRole('button', { name: /finalizado/i }));
    expect(onMarkFinished).toHaveBeenCalledWith('c2');
  });
});
