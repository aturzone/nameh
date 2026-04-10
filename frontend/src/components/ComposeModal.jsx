import { useState } from 'react';
import { useI18n } from '../i18n';
import { X, Send, Minus } from 'lucide-react';

export default function ComposeModal({ onClose, onSend, replyTo }) {
  const { t } = useI18n();
  const [to, setTo] = useState(replyTo ? replyTo.from_addr : '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject.replace(/^(Re|Fwd):\s*/i, '')}` : '');
  const [body, setBody] = useState(replyTo ? `\n\n--- ${t('reply')} ---\n${replyTo.preview || ''}` : '');
  const [sending, setSending] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const send = async () => {
    if (!to.trim() || !subject.trim()) return;
    setSending(true);
    await onSend({ to: to.split(',').map(s => s.trim()), subject, body: `<p>${body.replace(/\n/g, '<br/>')}</p>`, folder: 'sent' });
    setSending(false);
  };

  if (minimized) {
    return (
      <div className="fixed bottom-0 end-6 z-50 slide-up">
        <button data-testid="compose-restore-btn" onClick={() => setMinimized(false)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--c-text)] text-white text-sm font-medium rounded-t-lg shadow-xl hover:bg-[var(--c-text)]/90 transition-fast">
          <Send className="w-4 h-4" />
          <span className="max-w-[200px] truncate">{subject || t('new_message')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 end-6 z-50 w-[520px] bg-white rounded-t-xl shadow-2xl border border-[var(--c-border)] slide-up" data-testid="compose-modal">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--c-text)] rounded-t-xl cursor-move">
        <span className="text-sm font-medium text-white">{replyTo ? t('reply') : t('new_message')}</span>
        <div className="flex items-center gap-1">
          <button data-testid="compose-minimize-btn" onClick={() => setMinimized(true)} className="p-1 text-white/70 hover:text-white transition-fast"><Minus className="w-4 h-4" /></button>
          <button data-testid="compose-close-btn" onClick={onClose} className="p-1 text-white/70 hover:text-white transition-fast"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="p-3 space-y-0">
        <Field label={t('to_field')} testId="compose-to-input" value={to} onChange={setTo} placeholder="recipient@example.com" />
        <Field label={t('subject')} testId="compose-subject-input" value={subject} onChange={setSubject} placeholder={t('subject')} />
        <textarea data-testid="compose-body-input" value={body} onChange={(e) => setBody(e.target.value)} rows={10}
          placeholder={t('write_message')} className="w-full text-sm resize-none focus:outline-none leading-relaxed pt-2" />
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--c-border)]">
        <button data-testid="compose-send-btn" onClick={send} disabled={sending || !to.trim()}
          className="flex items-center gap-2 px-5 py-1.5 bg-[var(--c-accent)] text-white text-sm font-medium rounded-2xl hover:bg-[var(--c-accent-hover)] transition-fast disabled:opacity-50 shadow-sm">
          <Send className="w-3.5 h-3.5" />
          {sending ? t('sending') : t('send')}
        </button>
        <button onClick={onClose} className="text-xs text-[var(--c-text2)] hover:text-[var(--c-danger)] transition-fast">{t('discard')}</button>
      </div>
    </div>
  );
}

function Field({ label, testId, value, onChange, placeholder }) {
  return (
    <div className="flex items-center border-b border-[var(--c-border)]/50 py-1.5">
      <span className="text-xs text-[var(--c-text2)] w-14 shrink-0">{label}:</span>
      <input data-testid={testId} type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="flex-1 text-sm focus:outline-none" />
    </div>
  );
}
