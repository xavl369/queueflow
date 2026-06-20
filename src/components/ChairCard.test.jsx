import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChairCard from './ChairCard.jsx';

const clients = [
  { id: 'c1', name: 'Ana García', status: 'called', turn_number: 1, priority: false },
  { id: 'c2', name: 'Luis Pérez', status: 'attending', turn_number: 2, priority: false },
];

describe('ChairCard', () => {
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
