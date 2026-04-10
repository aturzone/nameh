import { useState } from 'react';
import { X, Send, Minus } from 'lucide-react';

export default function ComposeModal({ onClose, onSend, replyTo }) {
  const [to, setTo] = useState(replyTo ? replyTo.from_addr : '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject.replace(/^Re:\s*/i, '')}` : '');
  const [body, setBody] = useState(replyTo ? `\n\n--- Original Message ---\n${replyTo.preview || ''}` : '');
  const [sending, setSending] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim()) return;
    setSending(true);
    await onSend({ to: to.split(',').map(s => s.trim()), subject, body: `<p>${body.replace(/\n/g, '<br/>')}</p>`, folder: 'sent' });
    setSending(false);
  };

  if (minimized) {
    return (
      <div className="fixed bottom-0 end-6 z-50 animate-slide-up">
        <button
          data-testid="compose-restore-btn"
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 px-4 py-2.5 bg-nameh-accent text-white text-sm font-medium rounded-t shadow-lg hover:bg-nameh-accent-hover transition-colors"
        >
          <Send className="w-4 h-4" />
          {subject || 'New message'}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 end-6 z-50 w-[520px] bg-white rounded-t-lg shadow-2xl border border-nameh-border animate-slide-up" data-testid="compose-modal">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-nameh-primary rounded-t-lg">
        <span className="text-sm font-medium text-white">{replyTo ? 'Reply' : 'New Message'}</span>
        <div className="flex items-center gap-1">
          <button data-testid="compose-minimize-btn" onClick={() => setMinimized(true)} className="p-1 text-white/70 hover:text-white transition-colors">
            <Minus className="w-4 h-4" />
          </button>
          <button data-testid="compose-close-btn" onClick={onClose} className="p-1 text-white/70 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="p-3 space-y-2">
        <div className="flex items-center border-b border-nameh-border pb-2">
          <span className="text-xs text-nameh-secondary w-12 shrink-0">To:</span>
          <input
            data-testid="compose-to-input"
            type="text" value={to} onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
            className="flex-1 text-sm font-body focus:outline-none"
          />
        </div>
        <div className="flex items-center border-b border-nameh-border pb-2">
          <span className="text-xs text-nameh-secondary w-12 shrink-0">Subject:</span>
          <input
            data-testid="compose-subject-input"
            type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className="flex-1 text-sm font-body focus:outline-none"
          />
        </div>
        <textarea
          data-testid="compose-body-input"
          value={body} onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder="Write your message..."
          className="w-full text-sm font-body resize-none focus:outline-none leading-relaxed"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-nameh-border">
        <button
          data-testid="compose-send-btn"
          onClick={handleSend} disabled={sending || !to.trim()}
          className="flex items-center gap-2 px-4 py-1.5 bg-nameh-accent text-white text-sm font-medium rounded hover:bg-nameh-accent-hover focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none transition-colors disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          {sending ? 'Sending...' : 'Send'}
        </button>
        <button onClick={onClose} className="text-xs text-nameh-secondary hover:text-nameh-danger transition-colors">
          Discard
        </button>
      </div>
    </div>
  );
}
