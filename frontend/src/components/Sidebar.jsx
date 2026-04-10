import { useContext } from 'react';
import { AuthContext } from '../App';
import { useI18n } from '../i18n';
import Logo from '../assets/Logo';
import { Inbox, Star, Send, FileEdit, Trash2, ShieldAlert, PenSquare, LogOut, Settings, Tag, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const ICONS = { inbox: Inbox, starred: Star, sent: Send, drafts: FileEdit, trash: Trash2, spam: ShieldAlert };

export default function Sidebar({ folders, labels, activeFolder, activeLabel, onFolderChange, onLabelChange, onCompose, onSettings, collapsed, onToggleCollapse }) {
  const { user, logout } = useContext(AuthContext);
  const { t } = useI18n();

  return (
    <aside className={`h-full flex flex-col bg-[var(--c-bg2)] shrink-0 border-e border-[var(--c-border)] transition-all duration-200 ${collapsed ? 'w-[60px]' : 'w-[230px]'}`} data-testid="sidebar">
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <button onClick={onToggleCollapse} data-testid="sidebar-toggle" className="p-1.5 rounded-lg text-[var(--c-text2)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg3)]">
          {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            <Logo size={22} />
            <span className="font-heading text-[15px] font-extrabold tracking-tight text-[var(--c-text)]">nameh.me</span>
          </div>
        )}
      </div>

      <div className="px-2 py-2">
        <button data-testid="compose-btn" onClick={onCompose}
          className={`w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--c-accent)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--c-accent-hover)] active:scale-[0.98] transition-all shadow-sm ${collapsed ? 'px-0' : ''}`}>
          <PenSquare className="w-4 h-4" />
          {!collapsed && t('compose')}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {folders.map(f => {
          const Icon = ICONS[f.name] || Inbox;
          const active = f.name === activeFolder && !activeLabel;
          return (
            <button key={f.name} data-testid={`folder-${f.name}`} onClick={() => onFolderChange(f.name)}
              title={collapsed ? t(f.name) : undefined}
              className={`w-full flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13px] mb-px ${
                active ? 'bg-[var(--c-bg)] text-[var(--c-accent)] font-semibold shadow-sm border-s-[3px] border-s-[var(--c-accent)]' : 'text-[var(--c-text2)] hover:bg-[var(--c-bg)] hover:text-[var(--c-text)] border-s-[3px] border-s-transparent'
              }`}>
              <Icon className="w-[17px] h-[17px] shrink-0" />
              {!collapsed && <span className="flex-1 text-start">{t(f.name)}</span>}
              {!collapsed && f.unread > 0 && <span className="text-xs font-bold text-[var(--c-accent)]">{f.unread}</span>}
            </button>
          );
        })}

        {labels.length > 0 && !collapsed && (
          <>
            <div className="flex items-center px-3 pt-5 pb-1">
              <Tag className="w-3 h-3 text-[var(--c-text3)] me-1.5" />
              <span className="text-[10px] font-bold text-[var(--c-text3)] uppercase tracking-widest">{t('labels')}</span>
            </div>
            {labels.map(lb => {
              const active = lb.id === activeLabel;
              return (
                <button key={lb.id} data-testid={`label-${lb.id}`} onClick={() => onLabelChange(lb.id)}
                  className={`w-full flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13px] mb-px ${
                    active ? 'bg-[var(--c-bg)] font-semibold shadow-sm' : 'text-[var(--c-text2)] hover:bg-[var(--c-bg)] hover:text-[var(--c-text)]'
                  }`}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/5" style={{ background: lb.color }} />
                  <span className="flex-1 text-start truncate">{lb.name}</span>
                </button>
              );
            })}
          </>
        )}

        {labels.length > 0 && collapsed && (
          <>
            <div className="px-3 pt-4 pb-1">
              <div className="w-full h-px bg-[var(--c-border)]" />
            </div>
            {labels.map(lb => (
              <button key={lb.id} data-testid={`label-${lb.id}`} onClick={() => onLabelChange(lb.id)}
                title={lb.name}
                className={`w-full flex items-center justify-center py-[7px] rounded-lg mb-px ${
                  lb.id === activeLabel ? 'bg-[var(--c-bg)] shadow-sm' : 'hover:bg-[var(--c-bg)]'
                }`}>
                <span className="w-3 h-3 rounded-full ring-1 ring-black/5" style={{ background: lb.color }} />
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-[var(--c-border)] p-2">
        <button data-testid="settings-btn" onClick={onSettings}
          title={collapsed ? t('settings') : undefined}
          className="w-full flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13px] text-[var(--c-text2)] hover:bg-[var(--c-bg)] hover:text-[var(--c-text)]">
          <Settings className="w-[17px] h-[17px]" /> {!collapsed && t('settings')}
        </button>
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-[var(--c-accent)] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {(user?.username || 'U')[0].toUpperCase()}
          </div>
          {!collapsed && <span className="flex-1 text-[13px] font-medium text-[var(--c-text)] truncate">{user?.username}</span>}
          <button data-testid="logout-btn" onClick={logout} title={t('logout')} className="text-[var(--c-text3)] hover:text-[var(--c-danger)]">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
