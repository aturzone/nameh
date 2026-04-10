import { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Mail from './pages/Mail';
import api from './services/api';

export const AuthContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nameh_token');
    if (token) {
      api.setToken(token);
      api.get('/api/users/me')
        .then(u => setUser(u))
        .catch(() => api.clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    api.setToken(token);
    setUser(userData);
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center animate-fade-in">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-nameh-primary">nameh.me</h1>
          <div className="mt-3 w-8 h-0.5 bg-nameh-accent mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
          <Route path="/*" element={user ? <Mail /> : <Navigate to="/auth" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
