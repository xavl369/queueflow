import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase.js';

export default function RequireAuth({ children }) {
  const [user, setUser] = useState(undefined);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  if (user === undefined) return <p style={{ padding: '24px' }}>Verificando sesión...</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
