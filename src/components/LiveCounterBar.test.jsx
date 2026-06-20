import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LiveCounterBar from './LiveCounterBar.jsx';

describe('LiveCounterBar', () => {
  it('shows the section labels', () => {
    render(<LiveCounterBar clients={[]} />);
    expect(screen.getByText(/atendidos/i)).toBeInTheDocument();
    expect(screen.getByText(/en espera/i)).toBeInTheDocument();
    expect(screen.getByText(/ausentes/i)).toBeInTheDocument();
  });

  it('shows zeros when there are no clients', () => {
    render(<LiveCounterBar clients={[]} />);
    expect(screen.getByTestId('count-atendidos')).toHaveTextContent('0');
    expect(screen.getByTestId('count-en-espera')).toHaveTextContent('0');
    expect(screen.getByTestId('count-ausentes')).toHaveTextContent('0');
  });

  it('counts finished clients as Atendidos', () => {
    const clients = [
      { id: '1', status: 'finished' },
      { id: '2', status: 'finished' },
      { id: '3', status: 'finished' },
    ];
    render(<LiveCounterBar clients={clients} />);
    expect(screen.getByTestId('count-atendidos')).toHaveTextContent('3');
  });

  it('counts waiting clients as En espera', () => {
    const clients = [
      { id: '1', status: 'waiting' },
      { id: '2', status: 'waiting' },
    ];
    render(<LiveCounterBar clients={clients} />);
    expect(screen.getByTestId('count-en-espera')).toHaveTextContent('2');
  });

  it('counts absent clients as Ausentes', () => {
    const clients = [{ id: '1', status: 'absent' }];
    render(<LiveCounterBar clients={clients} />);
    expect(screen.getByTestId('count-ausentes')).toHaveTextContent('1');
  });
});
