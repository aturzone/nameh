import { useI18n } from '../i18n';
import { Search, Star, Paperclip, Trash2, Archive, MailOpen, CheckSquare, Square, Minus } from 'lucide-react';

const CATS = ['primary', 'social', 'promotions', 'updates'];

function timeAgo(s) {
  const diff = Math.floor((Date.now() - new Date(s)) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const d = Math.floor(diff / 86400);
  if (d < 7) return `${d}d`;
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function EmailList({
  emails, selectedId, selectedIds, search, onSearchChange, onSelect,
  onToggleSelect, onToggleSelectAll, activeFolder, activeCategory,
  onCategoryChange, onBulkAction, onAction
}) {
  const { t } = useI18n();
  const showCats = activeFolder === 'inbox' && !search;
  const hasSel = selectedIds.size > 0;
  const allSel = emails.length > 0 && selectedIds.size === emails.length;

  return (
    <div className="w-[380px] h-full flex flex-col bg-[var(--c-bg)] shrink-0" data-testid="email-list-panel">
      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search className="absolute top-2.5 start-3 w-4 h-4 text-[var(--c-text3)]" />
          <input data-testid="search-input" type="text" placeholder={t('search_emails')} value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full ps-9 pe-3 py-2 bg-[var(--c-bg3)] rounded-lg text-sm text-[var(--c-text)] placeholder:text-[var(--c-text3)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)] focus:bg-[var(--c-bg)] border border-transparent focus:border-[var(--c-accent)]" />
        </div>
      </div>

      {showCats && (
        <div className="flex border-b border-[var(--c-border)]">
          <CatTab active={!activeCategory} onClick={() => onCategoryChange('')} label={t('inbox')} accent />
          {CATS.map(c => <CatTab key={c} active={activeCategory === c} onClick={() => onCategoryChange(c)} label={t(c)} />)}
        </div>
      )}

      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[var(--c-border)]/50 min-h-[34px]">
        <button data-testid="select-all-btn" onClick={onToggleSelectAll} className="p-1 text-[var(--c-text3)] hover:text-[var(--c-text)]">
          {allSel ? <CheckSquare className="w-4 h-4 text-[var(--c-accent)]" /> : hasSel ? <Minus className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>
        {hasSel ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-[var(--c-text2)] px-1">{selectedIds.size}</span>
            <Btn icon={Archive} onClick={() => onBulkAction('move', 'archive')} />
            <Btn icon={Trash2} onClick={() => onBulkAction('trash')} danger />
            <Btn icon={MailOpen} onClick={() => onBulkAction('read')} />
          </div>
        ) : <span className="text-[11px] text-[var(--c-text3)] ps-1">{emails.length} {t('messages')}</span>}
      </div>

      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="w-14 h-14 rounded-full bg-[var(--c-bg3)] flex items-center justify-center mb-3">
              <Search className="w-7 h-7 text-[var(--c-text3)]" />
            </div>
            <p className="text-sm text-[var(--c-text3)]">{t('no_emails')}</p>
          </div>
        ) : emails.map(email => (
          <Row key={email.id} email={email} active={email.id === selectedId} checked={selectedIds.has(email.id)}
            onSelect={onSelect} onToggle={onToggleSelect} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

function Row({ email, active, checked, onSelect, onToggle, onAction }) {
  const unread = !email.is_read;
  return (
    <div data-testid={`email-item-${email.id}`}
      className={`group flex items-start px-2 py-2 border-b border-[var(--c-border)]/50 cursor-pointer ${
        active ? 'bg-[var(--c-accent-light)] border-s-[3px] border-s-[var(--c-accent)]' : unread ? 'bg-[var(--c-bg)] border-s-[3px] border-s-transparent' : 'bg-[var(--c-bg2)]/50 border-s-[3px] border-s-transparent hover:bg-[var(--c-bg2)]'
      }`}>
      <div className="flex items-center gap-0.5 pt-0.5 shrink-0">
        <button onClick={e => { e.stopPropagation(); onToggle(email.id); }} className="p-1 text-[var(--c-text3)] hover:text-[var(--c-text)]" data-testid={`checkbox-${email.id}`}>
          {checked ? <CheckSquare className="w-4 h-4 text-[var(--c-accent)]" /> : <Square className="w-4 h-4" />}
        </button>
        <button onClick={e => { e.stopPropagation(); onAction(email.id, email.is_starred ? 'unstar' : 'star'); }} className="p-0.5" data-testid={`star-${email.id}`}>
          <Star className={`w-4 h-4 ${email.is_starred ? 'text-[var(--c-star)] fill-[var(--c-star)]' : 'text-[var(--c-border2)] hover:text-[var(--c-star)]'}`} />
        </button>
      </div>
      <div className="flex-1 min-w-0 ps-1" onClick={() => onSelect(email.id)}>
        <div className="flex items-baseline gap-2">
          <span className={`text-[13px] shrink-0 ${unread ? 'font-bold text-[var(--c-text)]' : 'text-[var(--c-text2)]'}`} style={{ maxWidth: 140 }}>
            {email.from_name}
          </span>
          <span className={`flex-1 text-[13px] truncate ${unread ? 'font-semibold text-[var(--c-text)]' : 'text-[var(--c-text2)]'}`}>
            {email.subject}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {email.has_attachments && <Paperclip className="w-3 h-3 text-[var(--c-text3)]" />}
            <span className="text-[11px] text-[var(--c-text3)] whitespace-nowrap">{timeAgo(email.date)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {unread && <span className="w-[6px] h-[6px] rounded-full bg-[var(--c-accent)] shrink-0" data-testid="unread-dot" />}
          <span className="text-[12px] text-[var(--c-text3)] truncate">{email.preview}</span>
        </div>
      </div>
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 ps-1 pt-0.5">
        <button onClick={e => { e.stopPropagation(); onAction(email.id, 'move', 'archive'); }} className="p-1 text-[var(--c-text3)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg3)] rounded">
          <Archive className="w-3.5 h-3.5" />
        </button>
        <button onClick={e => { e.stopPropagation(); onAction(email.id, 'trash'); }} className="p-1 text-[var(--c-text3)] hover:text-[var(--c-danger)] hover:bg-[var(--c-bg3)] rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function CatTab({ active, onClick, label, accent }) {
  return (
    <button onClick={onClick} className={`flex-1 py-2.5 text-[12px] font-medium border-b-2 ${
      active ? `text-[var(--c-accent)] border-[var(--c-accent)]` : 'text-[var(--c-text3)] border-transparent hover:text-[var(--c-text2)] hover:border-[var(--c-border)]'
    }`}>{label}</button>
  );
}

function Btn({ icon: Icon, onClick, danger }) {
  return (
    <button onClick={onClick} className={`p-1.5 rounded ${danger ? 'text-[var(--c-text3)] hover:text-[var(--c-danger)] hover:bg-[var(--c-bg3)]' : 'text-[var(--c-text3)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg3)]'}`}>
      <Icon className="w-4 h-4" />
    </button>
  );
}
