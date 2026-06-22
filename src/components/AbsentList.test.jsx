import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AbsentList from './AbsentList.jsx';

const absentClients = [
  { id: '1', name: 'Ana García', turn_number: 2 },
  { id: '2', name: 'Luis Pérez', turn_number: 5 },
];

describe('AbsentList', () => {
  it('is collapsed by default', () => {
    render(<AbsentList clients={absentClients} onReactivate={vi.fn()} />);
    expect(screen.queryByText('Ana García')).not.toBeInTheDocument();
  });

  it('shows the absent count in the toggle button', () => {
    render(<AbsentList clients={absentClients} onReactivate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /ausentes \(2\)/i })).toBeInTheDocument();
  });

  it('shows 0 when no absent clients', () => {
    render(<AbsentList clients={[]} onReactivate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /ausentes \(0\)/i })).toBeInTheDocument();
  });

  it('expands to show clients when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<AbsentList clients={absentClients} onReactivate={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /ausentes/i }));
    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('Luis Pérez')).toBeInTheDocument();
  });

  it('collapses again on second click', async () => {
    const user = userEvent.setup();
    render(<AbsentList clients={absentClients} onReactivate={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /ausentes/i }));
    await user.click(screen.getByRole('button', { name: /ausentes/i }));
    expect(screen.queryByText('Ana García')).not.toBeInTheDocument();
  });

  it('shows a REACTIVAR button for each absent client when expanded', async () => {
    const user = userEvent.setup();
    render(<AbsentList clients={absentClients} onReactivate={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /ausentes/i }));
    const reactivarButtons = screen.getAllByRole('button', { name: /reactivar/i });
    expect(reactivarButtons).toHaveLength(2);
  });

  it('calls onReactivate with the client id when REACTIVAR is pressed', async () => {
    const onReactivate = vi.fn();
    const user = userEvent.setup();
    render(<AbsentList clients={absentClients} onReactivate={onReactivate} />);
    await user.click(screen.getByRole('button', { name: /ausentes/i }));
    await user.click(screen.getAllByRole('button', { name: /reactivar/i })[0]);
    expect(onReactivate).toHaveBeenCalledWith('1');
  });
});
