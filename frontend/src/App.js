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

  const toast = useCallback((msg, action, dur = 4000) => {
    const id = Date.now();
    setToasts(p => [...p, { id, message: msg, action }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), dur);
  }, []);

  const dismissToast = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);

  useEffect(() => {
    // Apply saved theme on app load
    const savedTheme = localStorage.getItem('nameh_theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

    const tk = localStorage.getItem('nameh_token');
    if (tk) {
      api.setToken(tk);
      api.get('/api/users/me').then(setUser).catch(() => api.clearToken()).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[var(--c-bg)]"><div className="w-6 h-6 border-2 border-[var(--c-accent)] border-t-transparent rounded-full animate-spin" /></div>
  );

  return (
    <I18nProvider>
      <AuthContext.Provider value={{ user, login: (tk, u) => { api.setToken(tk); setUser(u); }, logout: () => { api.clearToken(); setUser(null); } }}>
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
