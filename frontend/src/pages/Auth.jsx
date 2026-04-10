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
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const d = isLogin
        ? await api.post('/api/auth/login', { login: form.email, password: form.password })
        : await api.post('/api/auth/register', { email: form.email, username: form.username, password: form.password, display_name: form.display_name || form.username });
      login(d.access_token, { id: d.user_id, username: d.username });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="h-screen flex" data-testid="auth-page">
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 items-center justify-center">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 text-center px-14">
          <Logo size={64} className="mx-auto mb-6 [&_path]:fill-white [&_path]:stroke-white/30" />
          <h1 className="font-heading text-4xl font-extrabold text-white tracking-tight">nameh.me</h1>
          <p className="mt-3 text-lg text-blue-200">{t('email_reimagined')}</p>
          <div className="mt-10 grid grid-cols-3 gap-3 text-white/70 text-xs">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3"><div className="font-bold text-white text-xl mb-1">1M+</div>Users</div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3"><div className="font-bold text-white text-xl mb-1">E2E</div>Encrypted</div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3"><div className="font-bold text-white text-xl mb-1">JMAP</div>Protocol</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <Logo size={32} />
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-slate-900">nameh.me</h1>
          </div>
          <h2 className="text-2xl font-heading font-bold text-slate-900 mb-1">{isLogin ? t('welcome_back') : t('get_started')}</h2>
          <p className="text-sm text-slate-500 mb-6">{isLogin ? t('sign_in') : t('create_account')}</p>

          {error && <div data-testid="auth-error" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

          <form onSubmit={submit} className="space-y-3">
            <In icon={Mail} testId="auth-email-input" type="email" placeholder={t('email_address')} value={form.email} onChange={set('email')} />
            {!isLogin && <>
              <In icon={User} testId="auth-username-input" type="text" placeholder={t('username')} value={form.username} onChange={set('username')} />
              <In icon={User} testId="auth-displayname-input" type="text" placeholder={t('display_name')} value={form.display_name} onChange={set('display_name')} req={false} />
            </>}
            <div className="relative">
              <Lock className="absolute top-3 start-3 w-4 h-4 text-slate-400" />
              <input data-testid="auth-password-input" type={showPw ? 'text' : 'password'} required placeholder={t('password')} value={form.password} onChange={set('password')}
                className="w-full ps-10 pe-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute top-3 end-3 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button data-testid="auth-submit-btn" type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? t('please_wait') : (isLogin ? t('sign_in') : t('create_account'))}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? t('dont_have_account') : t('already_have_account')}{' '}
            <button data-testid="auth-toggle-btn" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-blue-700 font-medium hover:underline">
              {isLogin ? t('sign_up') : t('sign_in')}
            </button>
          </p>
          <p className="mt-3 text-center text-xs text-slate-400">{t('demo_hint')}</p>
        </div>
      </div>
    </div>
  );
}

function In({ icon: Icon, testId, req = true, ...p }) {
  return (
    <div className="relative">
      <Icon className="absolute top-3 start-3 w-4 h-4 text-slate-400" />
      <input data-testid={testId} required={req} {...p}
        className="w-full ps-10 pe-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>
  );
}
