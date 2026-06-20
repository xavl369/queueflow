import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WaitingList from './WaitingList.jsx';

describe('WaitingList', () => {
  it('shows empty message when no waiting clients', () => {
    render(<WaitingList clients={[]} />);
    expect(screen.getByText(/nadie en espera/i)).toBeInTheDocument();
  });

  it('shows clients sorted by priority then turn number', () => {
    const clients = [
      { id: '1', name: 'Regular B', status: 'waiting', turn_number: 2, priority: false },
      { id: '2', name: 'Priority A', status: 'waiting', turn_number: 5, priority: true },
      { id: '3', name: 'Regular A', status: 'waiting', turn_number: 1, priority: false },
    ];
    render(<WaitingList clients={clients} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Priority A');
    expect(items[1]).toHaveTextContent('Regular A');
    expect(items[2]).toHaveTextContent('Regular B');
  });

  it('shows #— for priority clients', () => {
    const clients = [{ id: '1', name: 'Ana', status: 'waiting', turn_number: 3, priority: true }];
    render(<WaitingList clients={clients} />);
    expect(screen.getByText('#—')).toBeInTheDocument();
  });

  it('shows turn number for regular clients', () => {
    const clients = [{ id: '1', name: 'Ana', status: 'waiting', turn_number: 3, priority: false }];
    render(<WaitingList clients={clients} />);
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('shows PRIORITARIA badge for priority clients', () => {
    const clients = [{ id: '1', name: 'Ana', status: 'waiting', turn_number: 3, priority: true }];
    render(<WaitingList clients={clients} />);
    expect(screen.getByText(/prioritaria/i)).toBeInTheDocument();
  });

  it('filters out non-waiting clients', () => {
    const clients = [
      { id: '1', name: 'Waiting', status: 'waiting', turn_number: 1, priority: false },
      { id: '2', name: 'Called', status: 'called', turn_number: 2, priority: false },
    ];
    render(<WaitingList clients={clients} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(1);
  });
});
