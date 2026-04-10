import { useI18n } from '../i18n';
import Logo from '../assets/Logo';
import { Reply, ReplyAll, Forward, Trash2, Archive, Star, StarOff, MailOpen, Mail, Tag } from 'lucide-react';

function fmtDate(s, lang) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(lang === 'fa' ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}

const COLORS = ['#1E3A8A', '#DC2626', '#16A34A', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#4338CA'];
function avatarColor(s) { let h = 0; for (let i = 0; i < (s||'').length; i++) h = s.charCodeAt(i) + ((h << 5) - h); return COLORS[Math.abs(h) % COLORS.length]; }

export default function EmailView({ email, labels, onReply, onAction, onDelete }) {
  const { t, lang } = useI18n();

  if (!email) return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8" data-testid="email-view-empty">
      <Logo size={40} className="opacity-20 mb-4" />
      <p className="text-sm text-slate-400 mb-2">{t('select_email')}</p>
      <p className="text-xs text-slate-300"><kbd>j</kbd> / <kbd>k</kbd> {t('kb_navigate')} &middot; <kbd>c</kbd> {t('compose')}</p>
    </div>
  );

  const eLbls = (email.labels || []).map(lid => labels.find(lb => lb.id === lid)).filter(Boolean);

  return (
    <div className="h-full flex flex-col overflow-hidden" data-testid="email-view">
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-200 bg-white shrink-0">
        <Tb testId="action-reply" icon={Reply} label={t('reply')} onClick={() => onReply(email)} />
        <Tb testId="action-reply-all" icon={ReplyAll} label={t('reply_all')} onClick={() => onReply(email)} />
        <Tb testId="action-forward" icon={Forward} label={t('forward')} onClick={() => onReply({ ...email, subject: `Fwd: ${email.subject}` })} />
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <Tb testId="action-archive" icon={Archive} label={t('archive')} onClick={() => onAction(email.id, 'move', 'archive')} />
        <Tb testId="action-trash" icon={Trash2} label={t('delete_email')} onClick={() => onDelete(email.id)} danger />
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <Tb testId="action-star" icon={email.is_starred ? StarOff : Star} label={email.is_starred ? t('unstar') : t('star')}
          onClick={() => onAction(email.id, email.is_starred ? 'unstar' : 'star')} />
        <Tb testId="action-read" icon={email.is_read ? Mail : MailOpen} label={email.is_read ? t('mark_unread') : t('mark_read')}
          onClick={() => onAction(email.id, email.is_read ? 'unread' : 'read')} />
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-5">
        <div className="flex items-start gap-2 mb-1">
          <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight flex-1" data-testid="email-subject">{email.subject}</h2>
          {email.is_starred && <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0 mt-1" />}
        </div>

        {eLbls.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            {eLbls.map(lb => (
              <span key={lb.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border"
                style={{ borderColor: lb.color + '40', color: lb.color, background: lb.color + '10' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: lb.color }} />{lb.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-start gap-3 mb-6 pb-5 border-b border-slate-200">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: avatarColor(email.from_name) }}>
            {(email.from_name || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-semibold text-sm text-slate-900">{email.from_name}</span>
              <span className="text-xs text-slate-400">&lt;{email.from_addr}&gt;</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{t('to_field')}: {Array.isArray(email.to) ? email.to.join(', ') : email.to}</div>
            <div className="text-xs text-slate-400 mt-0.5" data-testid="email-date">{fmtDate(email.date, lang)}</div>
          </div>
        </div>

        <div data-testid="email-body" className="prose prose-sm prose-slate max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{ __html: email.body }} />

        <div className="mt-8 pt-4 border-t border-slate-100">
          <button onClick={() => onReply(email)} data-testid="quick-reply-btn"
            className="w-full text-start px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600">
            {t('reply')}...
          </button>
        </div>
      </div>
    </div>
  );
}

function Tb({ icon: Icon, label, onClick, danger, testId }) {
  return (
    <button data-testid={testId} onClick={onClick} title={label}
      className={`p-2 rounded-md ${danger ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}>
      <Icon className="w-[17px] h-[17px]" />
    </button>
  );
}
