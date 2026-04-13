import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import * as api from '@/services/api';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within Providers');
  return ctx;
}

export function Providers({ children }) {
  const [user, setUser] = useState(undefined);

  const refresh = useCallback(async () => {
    if (!api.getStoredToken()) {
      setUser(null);
      return null;
    }
    try {
      const data = await api.getMe();
      const u = data?.user;
      if (u && typeof u === 'object' && u.id != null) {
        setUser(u);
        return u;
      }
      api.setStoredToken(null);
      setUser(null);
      return null;
    } catch {
      api.setStoredToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      api.setStoredToken(null);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, refresh, logout }}>
      {children}
      <Toaster toastOptions={{ duration: 4000 }} position="top-right" />
    </AuthContext.Provider>
  );
}
