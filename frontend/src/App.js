import { useState, useEffect, createContext, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n';
import Auth from './pages/Auth';
import Mail from './pages/Mail';
import Toast from './components/Toast';
import api from './services/api';

export const AuthContext = createContext(null);
export const ToastContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, action, duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, action }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('nameh_token');
    if (token) {
      api.setToken(token);
      api.get('/api/users/me').then(setUser).catch(() => api.clearToken()).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback((token, userData) => { api.setToken(token); setUser(userData); }, []);
  const logout = useCallback(() => { api.clearToken(); setUser(null); }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center fade-in">
        <div className="w-10 h-10 border-2 border-[var(--c-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );

  return (
    <I18nProvider>
      <AuthContext.Provider value={{ user, login, logout }}>
        <ToastContext.Provider value={{ toast, dismissToast }}>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
              <Route path="/*" element={user ? <Mail /> : <Navigate to="/auth" />} />
            </Routes>
          </BrowserRouter>
          <Toast toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
      </AuthContext.Provider>
    </I18nProvider>
  );
}

export default App;
