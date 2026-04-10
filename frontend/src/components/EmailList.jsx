import { Search, Paperclip, Star } from 'lucide-react';

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function EmailList({ emails, selectedId, search, onSearchChange, onSelect, activeFolder }) {
  return (
    <div className="w-[360px] h-full flex flex-col bg-white shrink-0" data-testid="email-list-panel">
      {/* Search */}
      <div className="p-3 border-b border-nameh-border">
        <div className="relative">
          <Search className="absolute top-2.5 start-3 w-4 h-4 text-nameh-secondary" />
          <input
            data-testid="search-input"
            type="text"
            placeholder="Search emails..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full ps-9 pe-3 py-2 bg-nameh-surface border border-nameh-border rounded text-sm font-body placeholder:text-nameh-secondary/60 focus:outline-none focus:ring-2 focus:ring-nameh-accent focus:border-transparent transition-shadow"
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="overline capitalize">{activeFolder}</p>
          <span className="text-xs text-nameh-secondary">{emails.length} messages</span>
        </div>
      </div>

      {/* Email items */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-fade-in">
            <img
              src="https://static.prod-images.emergentagent.com/jobs/27b2d35e-9173-449a-8418-3fea8c0fa0f1/images/1b791fbd32881266770f0fdf9605d2102ade37f2524db0bbc13fe72746ab3f8c.png"
              alt="Empty" className="w-28 h-28 opacity-60 mb-4"
            />
            <p className="text-sm text-nameh-secondary">No emails here</p>
          </div>
        ) : (
          emails.map((email, i) => (
            <button
              key={email.id}
              data-testid={`email-item-${email.id}`}
              onClick={() => onSelect(email.id)}
              className={`w-full text-start p-3 border-b border-nameh-border transition-colors animate-fade-in ${
                email.id === selectedId
                  ? 'bg-blue-50/70 border-s-[3px] border-s-nameh-accent'
                  : 'hover:bg-nameh-hover border-s-[3px] border-s-transparent'
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-center gap-2 mb-1">
                {!email.is_read && (
                  <span className="w-2 h-2 rounded-full bg-nameh-unread shrink-0" data-testid="unread-dot" />
                )}
                <span className={`flex-1 text-sm truncate ${email.is_read ? 'text-nameh-secondary' : 'font-medium text-nameh-primary'}`}>
                  {email.from_name}
                </span>
                <span className="text-xs text-nameh-secondary shrink-0">{timeAgo(email.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {email.is_starred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                <p className={`text-sm truncate ${email.is_read ? 'text-slate-600' : 'font-medium text-slate-800'}`}>
                  {email.subject}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-sm text-nameh-secondary truncate flex-1">{email.preview}</p>
                {email.has_attachments && <Paperclip className="w-3.5 h-3.5 text-nameh-secondary shrink-0" />}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
