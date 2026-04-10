import { useContext } from 'react';
import { AuthContext } from '../App';
import { useI18n } from '../i18n';
import Logo from '../assets/Logo';
import { Inbox, Star, Send, FileEdit, Trash2, ShieldAlert, PenSquare, LogOut, Settings, Tag } from 'lucide-react';

const ICONS = { inbox: Inbox, starred: Star, sent: Send, drafts: FileEdit, trash: Trash2, spam: ShieldAlert };

export default function Sidebar({ folders, labels, activeFolder, activeLabel, onFolderChange, onLabelChange, onCompose, onSettings }) {
  const { user, logout } = useContext(AuthContext);
  const { t } = useI18n();

  return (
    <aside className="w-[230px] h-full flex flex-col bg-slate-50 shrink-0 border-e border-slate-200" data-testid="sidebar">
      <div className="flex items-center gap-2 px-5 pt-5 pb-2">
        <Logo size={26} />
        <span className="font-heading text-[17px] font-extrabold tracking-tight text-slate-900">nameh.me</span>
      </div>

      <div className="px-3 py-2">
        <button data-testid="compose-btn" onClick={onCompose}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 active:scale-[0.98] transition-all shadow-sm">
          <PenSquare className="w-4 h-4" />
          {t('compose')}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {folders.map(f => {
          const Icon = ICONS[f.name] || Inbox;
          const active = f.name === activeFolder && !activeLabel;
          return (
            <button key={f.name} data-testid={`folder-${f.name}`} onClick={() => onFolderChange(f.name)}
              className={`w-full flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13px] mb-px ${
                active ? 'bg-white text-blue-900 font-semibold shadow-sm border-s-[3px] border-s-blue-900' : 'text-slate-700 hover:bg-white hover:text-slate-900 border-s-[3px] border-s-transparent'
              }`}>
              <Icon className="w-[17px] h-[17px] shrink-0" />
              <span className="flex-1 text-start">{t(f.name)}</span>
              {f.unread > 0 && <span className="text-xs font-bold text-blue-700">{f.unread}</span>}
            </button>
          );
        })}

        {labels.length > 0 && (
          <>
            <div className="flex items-center px-3 pt-5 pb-1">
              <Tag className="w-3 h-3 text-slate-400 me-1.5" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('labels')}</span>
            </div>
            {labels.map(lb => {
              const active = lb.id === activeLabel;
              return (
                <button key={lb.id} data-testid={`label-${lb.id}`} onClick={() => onLabelChange(lb.id)}
                  className={`w-full flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13px] mb-px ${
                    active ? 'bg-white font-semibold shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/5" style={{ background: lb.color }} />
                  <span className="flex-1 text-start truncate">{lb.name}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-slate-200 p-2">
        <button data-testid="settings-btn" onClick={onSettings}
          className="w-full flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13px] text-slate-500 hover:bg-white hover:text-slate-900">
          <Settings className="w-[17px] h-[17px]" /> {t('settings')}
        </button>
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {(user?.username || 'U')[0].toUpperCase()}
          </div>
          <span className="flex-1 text-[13px] font-medium text-slate-800 truncate">{user?.username}</span>
          <button data-testid="logout-btn" onClick={logout} title={t('logout')} className="text-slate-400 hover:text-red-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
