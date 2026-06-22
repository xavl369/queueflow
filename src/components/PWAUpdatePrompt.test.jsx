import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(),
}));

import { useRegisterSW } from 'virtual:pwa-register/react';
import { PWAUpdatePrompt } from './PWAUpdatePrompt.jsx';

function mockHook({ offlineReady = false, needRefresh = false } = {}) {
  const setOfflineReady = vi.fn();
  const setNeedRefresh = vi.fn();
  const updateServiceWorker = vi.fn();
  useRegisterSW.mockReturnValue({
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  });
  return { setOfflineReady, setNeedRefresh, updateServiceWorker };
}

describe('PWAUpdatePrompt', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing when no update and not offline-ready', () => {
    mockHook();
    const { container } = render(<PWAUpdatePrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('shows update banner when needRefresh is true', () => {
    mockHook({ needRefresh: true });
    render(<PWAUpdatePrompt />);
    expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument();
    expect(screen.getByText(/nueva versión/i)).toBeInTheDocument();
  });

  it('shows offline-ready message when offlineReady is true', () => {
    mockHook({ offlineReady: true });
    render(<PWAUpdatePrompt />);
    expect(screen.getByText(/sin conexión/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /actualizar/i })).not.toBeInTheDocument();
  });

  it('calls updateServiceWorker(true) when Actualizar is clicked', async () => {
    const user = userEvent.setup();
    const { updateServiceWorker } = mockHook({ needRefresh: true });
    render(<PWAUpdatePrompt />);
    await user.click(screen.getByRole('button', { name: /actualizar/i }));
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('hides the banner when close button is clicked', async () => {
    const user = userEvent.setup();
    const { setNeedRefresh, setOfflineReady } = mockHook({ needRefresh: true });
    render(<PWAUpdatePrompt />);
    await user.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(setNeedRefresh).toHaveBeenCalledWith(false);
    expect(setOfflineReady).toHaveBeenCalledWith(false);
  });
});
