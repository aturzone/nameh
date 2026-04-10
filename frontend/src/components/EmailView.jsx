import { Reply, Forward, Trash2, Archive, Star, StarOff, MailOpen, Mail } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function EmailView({ email, onReply, onAction, onDelete }) {
  if (!email) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8 animate-fade-in" data-testid="email-view-empty">
        <img
          src="https://static.prod-images.emergentagent.com/jobs/27b2d35e-9173-449a-8418-3fea8c0fa0f1/images/d7ca531a3926d2663bc0889b50c4bfe58312143bb6383b0ecb643598cc59ef9d.png"
          alt="" className="w-24 h-24 opacity-40 mb-4"
        />
        <p className="text-sm text-nameh-secondary">Select an email to read</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in" data-testid="email-view">
      {/* Action Bar */}
      <div className="sticky top-0 z-10 flex items-center gap-1 px-4 py-2.5 border-b border-nameh-border bg-white/80 backdrop-blur-md">
        <ActionBtn data-testid="action-reply" icon={Reply} label="Reply" onClick={() => onReply(email)} />
        <ActionBtn data-testid="action-forward" icon={Forward} label="Forward" onClick={() => onReply({ ...email, subject: `Fwd: ${email.subject}` })} />
        <div className="w-px h-5 bg-nameh-border mx-1" />
        <ActionBtn
          data-testid="action-star"
          icon={email.is_starred ? StarOff : Star}
          label={email.is_starred ? 'Unstar' : 'Star'}
          onClick={() => onAction(email.id, email.is_starred ? 'unstar' : 'star')}
        />
        <ActionBtn
          data-testid="action-read"
          icon={email.is_read ? Mail : MailOpen}
          label={email.is_read ? 'Mark unread' : 'Mark read'}
          onClick={() => onAction(email.id, email.is_read ? 'unread' : 'read')}
        />
        <ActionBtn data-testid="action-archive" icon={Archive} label="Archive" onClick={() => onAction(email.id, 'move', 'archive')} />
        <ActionBtn data-testid="action-trash" icon={Trash2} label="Trash" onClick={() => onDelete(email.id)} danger />
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <h2 className="font-heading text-xl font-bold text-nameh-primary tracking-tight mb-4" data-testid="email-subject">
          {email.subject}
        </h2>

        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-nameh-accent text-white flex items-center justify-center text-sm font-bold shrink-0">
            {(email.from_name || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-medium text-sm text-nameh-primary">{email.from_name}</span>
              <span className="text-xs text-nameh-secondary">&lt;{email.from_addr}&gt;</span>
            </div>
            <div className="text-xs text-nameh-secondary mt-0.5">
              To: {Array.isArray(email.to) ? email.to.join(', ') : email.to}
            </div>
            <div className="text-xs text-nameh-secondary mt-0.5" data-testid="email-date">
              {formatDate(email.date)}
            </div>
          </div>
          {email.is_starred && <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />}
        </div>

        <div
          data-testid="email-body"
          className="prose prose-sm max-w-none text-nameh-primary/90 font-body leading-relaxed"
          dangerouslySetInnerHTML={{ __html: email.body }}
        />
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, danger, ...props }) {
  return (
    <button
      {...props}
      onClick={onClick}
      title={label}
      className={`p-2 rounded transition-colors ${
        danger
          ? 'text-nameh-secondary hover:text-nameh-danger hover:bg-red-50'
          : 'text-nameh-secondary hover:text-nameh-primary hover:bg-nameh-hover'
      } focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
