import { useContext } from 'react';
import { AuthContext } from '../App';
import { Inbox, Send, FileEdit, Trash2, ShieldAlert, PenSquare, LogOut, Languages } from 'lucide-react';

const FOLDER_ICONS = {
  inbox: Inbox,
  sent: Send,
  drafts: FileEdit,
  trash: Trash2,
  spam: ShieldAlert,
};

const FOLDER_LABELS = {
  inbox: 'Inbox',
  sent: 'Sent',
  drafts: 'Drafts',
  trash: 'Trash',
  spam: 'Spam',
};

export default function Sidebar({ folders, activeFolder, onFolderChange, onCompose, rtl, onToggleRtl }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <aside className="w-[220px] h-full flex flex-col bg-nameh-surface shrink-0" data-testid="sidebar">
      {/* Brand */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="font-heading text-lg font-extrabold tracking-tight text-nameh-primary">nameh.me</h1>
      </div>

      {/* Compose */}
      <div className="px-3 pb-3">
        <button
          data-testid="compose-btn"
          onClick={onCompose}
          className="w-full flex items-center justify-center gap-2 py-2 bg-nameh-accent text-white text-sm font-medium rounded hover:bg-nameh-accent-hover focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none transition-colors"
        >
          <PenSquare className="w-4 h-4" />
          Compose
        </button>
      </div>

      {/* Folders */}
      <nav className="flex-1 overflow-y-auto px-2">
        <p className="overline px-3 pt-3 pb-2">FOLDERS</p>
        {folders.map((f) => {
          const Icon = FOLDER_ICONS[f.name] || Inbox;
          const active = f.name === activeFolder;
          return (
            <button
              key={f.name}
              data-testid={`folder-${f.name}`}
              onClick={() => onFolderChange(f.name)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                active
                  ? 'bg-white text-nameh-primary font-medium shadow-sm border-s-[3px] border-nameh-accent'
                  : 'text-nameh-secondary hover:bg-nameh-hover hover:text-nameh-primary border-s-[3px] border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-start">{FOLDER_LABELS[f.name] || f.name}</span>
              {f.unread > 0 && (
                <span className="text-xs font-semibold text-nameh-unread bg-blue-50 px-1.5 py-0.5 rounded-full">
                  {f.unread}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-nameh-border p-3 space-y-1">
        <button
          data-testid="rtl-toggle-btn"
          onClick={onToggleRtl}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-nameh-secondary hover:bg-nameh-hover hover:text-nameh-primary transition-colors"
        >
          <Languages className="w-4 h-4" />
          <span>{rtl ? 'LTR Mode' : 'RTL / Persian'}</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-nameh-accent text-white flex items-center justify-center text-xs font-bold shrink-0">
            {(user?.username || 'U')[0].toUpperCase()}
          </div>
          <span className="flex-1 text-sm font-medium text-nameh-primary truncate">{user?.username}</span>
          <button data-testid="logout-btn" onClick={logout} className="text-nameh-secondary hover:text-nameh-danger transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
