import { useRegisterSW } from 'virtual:pwa-register/react';

const bannerStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  backgroundColor: '#FF69B4',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  gap: '12px',
  boxShadow: '0 -2px 8px rgba(0,0,0,0.2)',
};

const actionBtnStyle = {
  minHeight: '40px',
  padding: '8px 16px',
  backgroundColor: '#fff',
  color: '#FF69B4',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 'bold',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const closeBtnStyle = {
  minHeight: '40px',
  minWidth: '40px',
  backgroundColor: 'transparent',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.6)',
  borderRadius: '6px',
  cursor: 'pointer',
  flexShrink: 0,
};

export function PWAUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  function close() {
    setOfflineReady(false);
    setNeedRefresh(false);
  }

  return (
    <div style={bannerStyle} role="alert">
      <span style={{ flex: 1, fontSize: '14px' }}>
        {needRefresh
          ? 'Nueva versión disponible.'
          : 'App lista para usar sin conexión.'}
      </span>
      {needRefresh && (
        <button
          style={actionBtnStyle}
          onClick={() => updateServiceWorker(true)}
        >
          Actualizar
        </button>
      )}
      <button style={closeBtnStyle} onClick={close} aria-label="Cerrar">
        ✕
      </button>
    </div>
  );
}
