import { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export default function Auth() {
  const { login } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', username: '', password: '', display_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await api.post('/api/auth/login', { login: form.email, password: form.password });
      } else {
        data = await api.post('/api/auth/register', {
          email: form.email,
          username: form.username,
          password: form.password,
          display_name: form.display_name || form.username,
        });
      }
      login(data.access_token, { id: data.user_id, username: data.username });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="h-screen flex" data-testid="auth-page">
      {/* Left — Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-nameh-primary items-center justify-center">
        <img
          src="https://static.prod-images.emergentagent.com/jobs/27b2d35e-9173-449a-8418-3fea8c0fa0f1/images/5f8cdd65636dc3cd893b9d270f24d4ca5c123add7b0d57ebdf24d714ec84161d.png"
          alt="" className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10 text-center px-12 animate-fade-in">
          <img
            src="https://static.prod-images.emergentagent.com/jobs/27b2d35e-9173-449a-8418-3fea8c0fa0f1/images/d7ca531a3926d2663bc0889b50c4bfe58312143bb6383b0ecb643598cc59ef9d.png"
            alt="Nameh.me" className="w-48 h-48 mx-auto mb-8 drop-shadow-2xl"
          />
          <h1 className="font-heading text-4xl font-extrabold text-white tracking-tight">nameh.me</h1>
          <p className="mt-3 text-lg text-white/70 font-body">Email, reimagined.</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden mb-10 text-center">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-nameh-primary">nameh.me</h1>
          </div>

          <p className="overline mb-2">{isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}</p>
          <h2 className="font-heading text-2xl font-bold text-nameh-primary tracking-tight mb-8">
            {isLogin ? 'Welcome back' : 'Get started'}
          </h2>

          {error && (
            <div data-testid="auth-error" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute top-3 start-3 w-4 h-4 text-nameh-secondary" />
              <input
                data-testid="auth-email-input"
                type="email" required placeholder="Email address" value={form.email} onChange={set('email')}
                className="w-full ps-10 pe-4 py-2.5 border border-nameh-border rounded text-sm font-body focus:outline-none focus:ring-2 focus:ring-nameh-accent focus:border-transparent transition-shadow"
              />
            </div>

            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute top-3 start-3 w-4 h-4 text-nameh-secondary" />
                  <input
                    data-testid="auth-username-input"
                    type="text" required placeholder="Username" value={form.username} onChange={set('username')}
                    className="w-full ps-10 pe-4 py-2.5 border border-nameh-border rounded text-sm font-body focus:outline-none focus:ring-2 focus:ring-nameh-accent focus:border-transparent transition-shadow"
                  />
                </div>
                <div className="relative">
                  <User className="absolute top-3 start-3 w-4 h-4 text-nameh-secondary" />
                  <input
                    data-testid="auth-displayname-input"
                    type="text" placeholder="Display name (optional)" value={form.display_name} onChange={set('display_name')}
                    className="w-full ps-10 pe-4 py-2.5 border border-nameh-border rounded text-sm font-body focus:outline-none focus:ring-2 focus:ring-nameh-accent focus:border-transparent transition-shadow"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Lock className="absolute top-3 start-3 w-4 h-4 text-nameh-secondary" />
              <input
                data-testid="auth-password-input"
                type={showPw ? 'text' : 'password'} required placeholder="Password" value={form.password} onChange={set('password')}
                className="w-full ps-10 pe-10 py-2.5 border border-nameh-border rounded text-sm font-body focus:outline-none focus:ring-2 focus:ring-nameh-accent focus:border-transparent transition-shadow"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute top-3 end-3 text-nameh-secondary hover:text-nameh-primary">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              data-testid="auth-submit-btn"
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-nameh-accent text-white text-sm font-medium rounded hover:bg-nameh-accent-hover focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign in' : 'Create account')}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-nameh-secondary">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              data-testid="auth-toggle-btn"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-nameh-accent font-medium hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <p className="mt-4 text-center text-xs text-nameh-secondary/60">
            Demo: demo@nameh.me / demo123
          </p>
        </div>
      </div>
    </div>
  );
}
