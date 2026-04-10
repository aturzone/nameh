import { useI18n } from '../i18n';
import Logo from '../assets/Logo';
import { Reply, ReplyAll, Forward, Trash2, Archive, Star, StarOff, MailOpen, Mail, MoreVertical, Tag } from 'lucide-react';

function fmtDate(s, lang) {
  if (!s) return '';
  const d = new Date(s);
  const loc = lang === 'fa' ? 'fa-IR' : 'en-US';
  return d.toLocaleDateString(loc, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
}

export default function EmailView({ email, labels, onReply, onAction, onDelete }) {
  const { t, lang } = useI18n();

  if (!email) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8 fade-in" data-testid="email-view-empty">
        <Logo size={48} className="opacity-20 mb-4" />
        <p className="text-sm text-[var(--c-text2)]">{t('select_email')}</p>
        <p className="text-xs text-[var(--c-text2)]/50 mt-2">
          <kbd>j</kbd> / <kbd>k</kbd> {t('kb_navigate')} &middot; <kbd>c</kbd> {t('compose')}
        </p>
      </div>
    );
  }

  const emailLabels = (email.labels || []).map(lid => labels.find(l => l.id === lid)).filter(Boolean);

  return (
    <div className="h-full flex flex-col overflow-hidden fade-in" data-testid="email-view">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--c-border)] bg-white shrink-0">
        <TBtn testId="action-reply" icon={Reply} label={t('reply')} onClick={() => onReply(email)} />
        <TBtn testId="action-reply-all" icon={ReplyAll} label={t('reply_all')} onClick={() => onReply(email)} />
        <TBtn testId="action-forward" icon={Forward} label={t('forward')} onClick={() => onReply({ ...email, subject: `Fwd: ${email.subject}` })} />
        <Sep />
        <TBtn testId="action-archive" icon={Archive} label={t('archive')} onClick={() => onAction(email.id, 'move', 'archive')} />
        <TBtn testId="action-trash" icon={Trash2} label={t('delete_email')} onClick={() => onDelete(email.id)} danger />
        <Sep />
        <TBtn testId="action-star" icon={email.is_starred ? StarOff : Star} label={email.is_starred ? t('unstar') : t('star')}
          onClick={() => onAction(email.id, email.is_starred ? 'unstar' : 'star')} />
        <TBtn testId="action-read" icon={email.is_read ? Mail : MailOpen} label={email.is_read ? t('mark_unread') : t('mark_read')}
          onClick={() => onAction(email.id, email.is_read ? 'unread' : 'read')} />
        <TBtn icon={MoreVertical} label="More" onClick={() => {}} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex items-start gap-2 mb-1">
          <h2 className="font-heading text-xl font-bold text-[var(--c-text)] tracking-tight flex-1" data-testid="email-subject">{email.subject}</h2>
          {email.is_starred && <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0 mt-1" />}
        </div>

        {emailLabels.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            {emailLabels.map(l => (
              <span key={l.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: l.color + '20', color: l.color }}>
                <Tag className="w-3 h-3" />{l.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-start gap-3 mb-6 pb-4 border-b border-[var(--c-border)]">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: stringToColor(email.from_name || '') }}>
            {(email.from_name || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-semibold text-sm text-[var(--c-text)]">{email.from_name}</span>
              <span className="text-xs text-[var(--c-text2)]">&lt;{email.from_addr}&gt;</span>
            </div>
            <div className="text-xs text-[var(--c-text2)] mt-0.5">{t('to_field')}: {Array.isArray(email.to) ? email.to.join(', ') : email.to}</div>
            <div className="text-xs text-[var(--c-text2)] mt-0.5" data-testid="email-date">{fmtDate(email.date, lang)}</div>
          </div>
        </div>

        <div data-testid="email-body" className="prose prose-sm max-w-none text-[var(--c-text)]/90 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: email.body }} />

        {/* Quick reply */}
        <div className="mt-8 pt-4 border-t border-[var(--c-border)]">
          <button onClick={() => onReply(email)} data-testid="quick-reply-btn"
            className="w-full text-start px-4 py-3 border border-[var(--c-border)] rounded-2xl text-sm text-[var(--c-text2)] hover:bg-[var(--c-hover)] transition-fast">
            {t('reply')}...
          </button>
        </div>
      </div>
    </div>
  );
}

function TBtn({ icon: Icon, label, onClick, danger, testId }) {
  return (
    <button data-testid={testId} onClick={onClick} title={label}
      className={`p-2 rounded-full transition-fast ${danger ? 'text-[var(--c-text2)] hover:text-[var(--c-danger)] hover:bg-red-50' : 'text-[var(--c-text2)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)]'}`}>
      <Icon className="w-[18px] h-[18px]" />
    </button>
  );
}

function Sep() { return <div className="w-px h-5 bg-[var(--c-border)] mx-0.5" />; }

function stringToColor(str) {
  const colors = ['#1A73E8', '#D93025', '#188038', '#E37400', '#A142F4', '#1967D2', '#B31412', '#137333'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
