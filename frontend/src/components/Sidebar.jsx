import { useContext } from 'react';
import { AuthContext } from '../App';
import { useI18n } from '../i18n';
import Logo from '../assets/Logo';
import { Inbox, Star, Send, FileEdit, Trash2, ShieldAlert, PenSquare, LogOut, Settings, ChevronDown } from 'lucide-react';

const ICONS = { inbox: Inbox, starred: Star, sent: Send, drafts: FileEdit, trash: Trash2, spam: ShieldAlert };

export default function Sidebar({ folders, labels, activeFolder, onFolderChange, onCompose, onSettings }) {
  const { user, logout } = useContext(AuthContext);
  const { t } = useI18n();

  return (
    <aside className="w-[220px] h-full flex flex-col bg-[var(--c-surface)] shrink-0" data-testid="sidebar">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
        <Logo size={28} />
        <span className="font-heading text-base font-bold tracking-tight text-[var(--c-text)]">nameh.me</span>
      </div>

      <div className="px-3 py-2">
        <button data-testid="compose-btn" onClick={onCompose}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--c-accent)] text-white text-sm font-medium rounded-2xl shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 hover:bg-[var(--c-accent-hover)] transition-fast">
          <PenSquare className="w-4 h-4" />
          {t('compose')}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {folders.map((f) => {
          const Icon = ICONS[f.name] || Inbox;
          const active = f.name === activeFolder;
          return (
            <button key={f.name} data-testid={`folder-${f.name}`} onClick={() => onFolderChange(f.name)}
              className={`w-full flex items-center gap-3 px-3 py-[7px] rounded-2xl text-[13px] transition-fast mb-0.5 ${
                active ? 'bg-[var(--c-selected)] text-[var(--c-accent)] font-semibold' : 'text-[var(--c-text)] hover:bg-[var(--c-hover)]'}`}>
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="flex-1 text-start">{t(f.name)}</span>
              {f.unread > 0 && <span className={`text-xs font-semibold ${active ? 'text-[var(--c-accent)]' : 'text-[var(--c-text2)]'}`}>{f.unread}</span>}
            </button>
          );
        })}

        {labels.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-3 pt-4 pb-1">
              <span className="text-[11px] font-semibold text-[var(--c-text2)] uppercase tracking-wider">{t('labels')}</span>
              <ChevronDown className="w-3 h-3 text-[var(--c-text2)]" />
            </div>
            {labels.map(l => (
              <button key={l.id} data-testid={`label-${l.id}`}
                className="w-full flex items-center gap-3 px-3 py-[7px] rounded-2xl text-[13px] text-[var(--c-text)] hover:bg-[var(--c-hover)] transition-fast">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: l.color }} />
                <span className="flex-1 text-start truncate">{l.name}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-[var(--c-border)] p-2 space-y-0.5">
        <button data-testid="settings-btn" onClick={onSettings}
          className="w-full flex items-center gap-3 px-3 py-[7px] rounded-2xl text-[13px] text-[var(--c-text2)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text)] transition-fast">
          <Settings className="w-[18px] h-[18px]" />
          <span>{t('settings')}</span>
        </button>
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-[var(--c-accent)] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {(user?.username || 'U')[0].toUpperCase()}
          </div>
          <span className="flex-1 text-[13px] font-medium text-[var(--c-text)] truncate">{user?.username}</span>
          <button data-testid="logout-btn" onClick={logout} title={t('logout')} className="text-[var(--c-text2)] hover:text-[var(--c-danger)] transition-fast">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
