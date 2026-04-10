import { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { useI18n } from '../i18n';
import Logo from '../assets/Logo';
import { Lock, Mail, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export default function Auth() {
  const { login } = useContext(AuthContext);
  const { t } = useI18n();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', username: '', password: '', display_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = isLogin
        ? await api.post('/api/auth/login', { login: form.email, password: form.password })
        : await api.post('/api/auth/register', { email: form.email, username: form.username, password: form.password, display_name: form.display_name || form.username });
      login(data.access_token, { id: data.user_id, username: data.username });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="h-screen flex" data-testid="auth-page">
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-[#1A73E8] items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A73E8] via-[#1557B0] to-[#0D47A1]" />
        <div className="relative z-10 text-center px-12 fade-in">
          <Logo size={72} className="mx-auto mb-6 drop-shadow-lg" />
          <h1 className="font-heading text-4xl font-extrabold text-white tracking-tight">nameh.me</h1>
          <p className="mt-3 text-lg text-white/80">{t('email_reimagined')}</p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-white/70 text-xs">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm"><div className="font-semibold text-white text-lg mb-1">1M+</div>Users</div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm"><div className="font-semibold text-white text-lg mb-1">E2E</div>Encrypted</div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm"><div className="font-semibold text-white text-lg mb-1">JMAP</div>Protocol</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm slide-up">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <Logo size={36} />
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-[var(--c-text)]">nameh.me</h1>
          </div>

          <h2 className="text-2xl font-heading font-bold text-[var(--c-text)] mb-1">{isLogin ? t('welcome_back') : t('get_started')}</h2>
          <p className="text-sm text-[var(--c-text2)] mb-6">{isLogin ? t('sign_in') : t('create_account')}</p>

          {error && <div data-testid="auth-error" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

          <form onSubmit={submit} className="space-y-3">
            <InputField icon={Mail} testId="auth-email-input" type="email" placeholder={t('email_address')} value={form.email} onChange={set('email')} />
            {!isLogin && (
              <>
                <InputField icon={User} testId="auth-username-input" type="text" placeholder={t('username')} value={form.username} onChange={set('username')} />
                <InputField icon={User} testId="auth-displayname-input" type="text" placeholder={t('display_name')} value={form.display_name} onChange={set('display_name')} required={false} />
              </>
            )}
            <div className="relative">
              <Lock className="absolute top-3 start-3 w-4 h-4 text-[var(--c-text2)]" />
              <input data-testid="auth-password-input" type={showPw ? 'text' : 'password'} required placeholder={t('password')} value={form.password} onChange={set('password')}
                className="w-full ps-10 pe-10 py-2.5 border border-[var(--c-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)] focus:border-transparent transition-fast" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute top-3 end-3 text-[var(--c-text2)] hover:text-[var(--c-text)]">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button data-testid="auth-submit-btn" type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--c-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--c-accent-hover)] transition-fast disabled:opacity-50">
              {loading ? t('please_wait') : (isLogin ? t('sign_in') : t('create_account'))}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--c-text2)]">
            {isLogin ? t('dont_have_account') : t('already_have_account')}{' '}
            <button data-testid="auth-toggle-btn" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-[var(--c-accent)] font-medium hover:underline">
              {isLogin ? t('sign_up') : t('sign_in')}
            </button>
          </p>
          <p className="mt-3 text-center text-xs text-[var(--c-text2)]/60">{t('demo_hint')}</p>
        </div>
      </div>
    </div>
  );
}

function InputField({ icon: Icon, testId, required = true, ...props }) {
  return (
    <div className="relative">
      <Icon className="absolute top-3 start-3 w-4 h-4 text-[var(--c-text2)]" />
      <input data-testid={testId} required={required} {...props}
        className="w-full ps-10 pe-4 py-2.5 border border-[var(--c-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)] focus:border-transparent transition-fast" />
    </div>
  );
}
