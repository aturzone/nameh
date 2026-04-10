import { useMemo } from 'react';
import { useI18n } from '../i18n';
import { Search, Star, Paperclip, Trash2, Archive, MailOpen, CheckSquare, Square, Minus } from 'lucide-react';

const CATEGORIES = ['primary', 'social', 'promotions', 'updates'];

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now - d) / 1000);
  if (sec < 60) return 'now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  const days = Math.floor(sec / 86400);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function EmailList({
  emails, selectedId, selectedIds, search, onSearchChange, onSelect,
  onToggleSelect, onToggleSelectAll, activeFolder, activeCategory,
  onCategoryChange, onBulkAction, onAction
}) {
  const { t } = useI18n();
  const showCategories = activeFolder === 'inbox' && !search;
  const hasSelection = selectedIds.size > 0;
  const allSelected = emails.length > 0 && selectedIds.size === emails.length;

  const list = useMemo(() => emails, [emails]);

  return (
    <div className="w-[380px] h-full flex flex-col bg-white shrink-0" data-testid="email-list-panel">
      {/* Search */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search className="absolute top-2.5 start-3 w-4 h-4 text-[var(--c-text2)]" />
          <input data-testid="search-input" type="text" placeholder={t('search_emails')} value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full ps-9 pe-3 py-2 bg-[var(--c-surface)] rounded-lg text-sm placeholder:text-[var(--c-text2)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)] focus:bg-white transition-fast" />
        </div>
      </div>

      {/* Category tabs */}
      {showCategories && (
        <div className="flex border-b border-[var(--c-border)]">
          <TabBtn active={!activeCategory} onClick={() => onCategoryChange('')} label={t('inbox')} />
          {CATEGORIES.map(c => (
            <TabBtn key={c} active={activeCategory === c} onClick={() => onCategoryChange(c)} label={t(c)} />
          ))}
        </div>
      )}

      {/* Bulk actions bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-[var(--c-border)] min-h-[36px]">
        <button data-testid="select-all-btn" onClick={onToggleSelectAll} className="p-1 text-[var(--c-text2)] hover:text-[var(--c-text)] transition-fast">
          {allSelected ? <CheckSquare className="w-4 h-4" /> : hasSelection ? <Minus className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>
        {hasSelection && (
          <div className="flex items-center gap-0.5 fade-in">
            <span className="text-xs text-[var(--c-text2)] px-1">{selectedIds.size}</span>
            <BulkBtn icon={Archive} title={t('archive')} onClick={() => onBulkAction('move', 'archive')} />
            <BulkBtn icon={Trash2} title={t('delete_email')} onClick={() => onBulkAction('trash')} danger />
            <BulkBtn icon={MailOpen} title={t('mark_read')} onClick={() => onBulkAction('read')} />
          </div>
        )}
        {!hasSelection && <span className="text-[11px] text-[var(--c-text2)] ps-1">{list.length} {t('messages')}</span>}
      </div>

      {/* Emails */}
      <div className="flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 fade-in">
            <div className="w-16 h-16 rounded-full bg-[var(--c-surface)] flex items-center justify-center mb-3">
              <Search className="w-8 h-8 text-[var(--c-border)]" />
            </div>
            <p className="text-sm text-[var(--c-text2)]">{t('no_emails')}</p>
          </div>
        ) : list.map((email) => (
          <EmailRow key={email.id} email={email}
            isSelected={email.id === selectedId} isChecked={selectedIds.has(email.id)}
            onSelect={onSelect} onToggleSelect={onToggleSelect} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

function EmailRow({ email, isSelected, isChecked, onSelect, onToggleSelect, onAction }) {
  return (
    <div
      data-testid={`email-item-${email.id}`}
      className={`group flex items-start gap-0 px-2 py-2 border-b border-[var(--c-border)]/50 cursor-pointer transition-fast ${
        isSelected ? 'bg-[var(--c-selected)]' : 'hover:bg-[var(--c-hover)]'
      } ${!email.is_read ? 'bg-white' : 'bg-[var(--c-surface)]/30'}`}
    >
      <div className="flex items-center gap-1 pt-0.5 shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onToggleSelect(email.id); }}
          className="p-1 text-[var(--c-text2)] hover:text-[var(--c-text)] transition-fast" data-testid={`checkbox-${email.id}`}>
          {isChecked ? <CheckSquare className="w-4 h-4 text-[var(--c-accent)]" /> : <Square className="w-4 h-4" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onAction(email.id, email.is_starred ? 'unstar' : 'star'); }}
          className="p-0.5 transition-fast" data-testid={`star-${email.id}`}>
          <Star className={`w-4 h-4 ${email.is_starred ? 'text-amber-400 fill-amber-400' : 'text-[var(--c-border)] hover:text-amber-300'}`} />
        </button>
      </div>

      <div className="flex-1 min-w-0 ps-1" onClick={() => onSelect(email.id)}>
        <div className="flex items-baseline gap-2">
          <span className={`text-[13px] truncate ${email.is_read ? 'text-[var(--c-text2)]' : 'font-semibold text-[var(--c-text)]'}`} style={{ maxWidth: '140px' }}>
            {email.from_name}
          </span>
          <span className={`flex-1 text-[13px] truncate ${email.is_read ? 'text-[var(--c-text2)]' : 'text-[var(--c-text)]'}`}>
            {email.subject}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {email.has_attachments && <Paperclip className="w-3.5 h-3.5 text-[var(--c-text2)]" />}
            <span className="text-[11px] text-[var(--c-text2)] whitespace-nowrap">{timeAgo(email.date)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {!email.is_read && <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-unread)] shrink-0" data-testid="unread-dot" />}
          <span className="text-[12px] text-[var(--c-text2)] truncate">{email.preview}</span>
        </div>
      </div>

      {/* Hover actions */}
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 ps-1 pt-0.5">
        <button onClick={(e) => { e.stopPropagation(); onAction(email.id, 'move', 'archive'); }} title="Archive"
          className="p-1 text-[var(--c-text2)] hover:text-[var(--c-text)] hover:bg-[var(--c-border)] rounded transition-fast">
          <Archive className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onAction(email.id, 'trash'); }} title="Trash"
          className="p-1 text-[var(--c-text2)] hover:text-[var(--c-danger)] hover:bg-red-50 rounded transition-fast">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-2.5 text-[12px] font-medium transition-fast border-b-2 ${
        active ? 'text-[var(--c-accent)] border-[var(--c-accent)]' : 'text-[var(--c-text2)] border-transparent hover:text-[var(--c-text)] hover:border-[var(--c-border)]'
      }`}>
      {label}
    </button>
  );
}

function BulkBtn({ icon: Icon, title, onClick, danger }) {
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 rounded transition-fast ${danger ? 'text-[var(--c-text2)] hover:text-[var(--c-danger)] hover:bg-red-50' : 'text-[var(--c-text2)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)]'}`}>
      <Icon className="w-4 h-4" />
    </button>
  );
}
