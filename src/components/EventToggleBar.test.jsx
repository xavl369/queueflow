import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EventToggleBar from './EventToggleBar.jsx';

describe('EventToggleBar — display', () => {
  it('shows the event name', () => {
    render(<EventToggleBar event={{ name: 'Fiesta Test', status: 'active' }} onStatusChange={vi.fn()} />);
    expect(screen.getByText('Fiesta Test')).toBeInTheDocument();
  });

  it('shows ABIERTO badge when status is active', () => {
    render(<EventToggleBar event={{ name: 'Test', status: 'active' }} onStatusChange={vi.fn()} />);
    expect(screen.getByText(/abierto/i)).toBeInTheDocument();
  });

  it('shows INACTIVO badge when status is inactive', () => {
    render(<EventToggleBar event={{ name: 'Test', status: 'inactive' }} onStatusChange={vi.fn()} />);
    expect(screen.getByText(/inactivo/i)).toBeInTheDocument();
  });

  it('shows CERRADO badge when status is closed', () => {
    render(<EventToggleBar event={{ name: 'Test', status: 'closed' }} onStatusChange={vi.fn()} />);
    expect(screen.getByText(/cerrado/i)).toBeInTheDocument();
  });
});

describe('EventToggleBar — actions', () => {
  it('shows ABRIR button when status is inactive', () => {
    render(<EventToggleBar event={{ name: 'Test', status: 'inactive' }} onStatusChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /abrir/i })).toBeInTheDocument();
  });

  it('shows CERRAR button when status is active', () => {
    render(<EventToggleBar event={{ name: 'Test', status: 'active' }} onStatusChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /cerrar/i })).toBeInTheDocument();
  });

  it('shows no action button when status is closed', () => {
    render(<EventToggleBar event={{ name: 'Test', status: 'closed' }} onStatusChange={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('clicking ABRIR calls onStatusChange("active") immediately', () => {
    const onStatusChange = vi.fn();
    render(<EventToggleBar event={{ name: 'Test', status: 'inactive' }} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByRole('button', { name: /abrir/i }));
    expect(onStatusChange).toHaveBeenCalledWith('active');
  });

  it('clicking CERRAR shows a confirmation dialog', () => {
    render(<EventToggleBar event={{ name: 'Test', status: 'active' }} onStatusChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(screen.getByText(/confirmar/i)).toBeInTheDocument();
  });

  it('confirming CERRAR calls onStatusChange("closed")', () => {
    const onStatusChange = vi.fn();
    render(<EventToggleBar event={{ name: 'Test', status: 'active' }} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onStatusChange).toHaveBeenCalledWith('closed');
  });

  it('cancelling CERRAR does not call onStatusChange', () => {
    const onStatusChange = vi.fn();
    render(<EventToggleBar event={{ name: 'Test', status: 'active' }} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onStatusChange).not.toHaveBeenCalled();
  });
});
