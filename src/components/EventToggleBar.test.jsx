import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventToggleBar from './EventToggleBar.jsx';

describe('EventToggleBar', () => {
  it('shows the event name', () => {
    render(<EventToggleBar event={{ name: 'Fiesta Test', status: 'active' }} />);
    expect(screen.getByText('Fiesta Test')).toBeInTheDocument();
  });

  it('shows ABIERTO badge when status is active', () => {
    render(<EventToggleBar event={{ name: 'Test', status: 'active' }} />);
    expect(screen.getByText(/abierto/i)).toBeInTheDocument();
  });

  it('shows INACTIVO badge when status is inactive', () => {
    render(<EventToggleBar event={{ name: 'Test', status: 'inactive' }} />);
    expect(screen.getByText(/inactivo/i)).toBeInTheDocument();
  });

  it('shows CERRADO badge when status is closed', () => {
    render(<EventToggleBar event={{ name: 'Test', status: 'closed' }} />);
    expect(screen.getByText(/cerrado/i)).toBeInTheDocument();
  });
});
