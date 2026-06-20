import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AbsentList from './AbsentList.jsx';

const absentClients = [
  { id: '1', name: 'Ana García', turn_number: 2 },
  { id: '2', name: 'Luis Pérez', turn_number: 5 },
];

describe('AbsentList', () => {
  it('is collapsed by default', () => {
    render(<AbsentList clients={absentClients} />);
    expect(screen.queryByText('Ana García')).not.toBeInTheDocument();
  });

  it('shows the absent count in the toggle button', () => {
    render(<AbsentList clients={absentClients} />);
    expect(screen.getByRole('button', { name: /ausentes \(2\)/i })).toBeInTheDocument();
  });

  it('shows 0 when no absent clients', () => {
    render(<AbsentList clients={[]} />);
    expect(screen.getByRole('button', { name: /ausentes \(0\)/i })).toBeInTheDocument();
  });

  it('expands to show clients when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<AbsentList clients={absentClients} />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('Luis Pérez')).toBeInTheDocument();
  });

  it('collapses again on second click', async () => {
    const user = userEvent.setup();
    render(<AbsentList clients={absentClients} />);
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('button'));
    expect(screen.queryByText('Ana García')).not.toBeInTheDocument();
  });
});
