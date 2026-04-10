import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { ToastContext } from '../App';
import { useI18n } from '../i18n';
import Sidebar from '../components/Sidebar';
import EmailList from '../components/EmailList';
import EmailView from '../components/EmailView';
import ComposeModal from '../components/ComposeModal';
import Settings from '../components/Settings';
import api from '../services/api';

export default function Mail() {
  const { toast } = useContext(ToastContext);
  const { t } = useI18n();
  const [folders, setFolders] = useState([]);
  const [labels, setLabels] = useState([]);
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [activeCategory, setActiveCategory] = useState('');
  const [emails, setEmails] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const emailCache = useRef(new Map());

  const loadFolders = useCallback(async () => {
    try { const d = await api.get('/api/mail/folders'); setFolders(d.folders); } catch {}
  }, []);

  const loadLabels = useCallback(async () => {
    try { const d = await api.get('/api/mail/labels'); setLabels(d.labels); } catch {}
  }, []);

  const loadEmails = useCallback(async () => {
    const catQ = activeCategory ? `&category=${activeCategory}` : '';
    const searchQ = search ? `&search=${encodeURIComponent(search)}` : '';
    const key = `${activeFolder}${catQ}${searchQ}`;
    const cached = emailCache.current.get(key);
    if (cached) setEmails(cached);
    try {
      const d = await api.get(`/api/mail/emails?folder=${activeFolder}${catQ}${searchQ}`);
      setEmails(d.emails);
      emailCache.current.set(key, d.emails);
    } catch {}
  }, [activeFolder, activeCategory, search]);

  useEffect(() => { loadFolders(); loadLabels(); }, [loadFolders, loadLabels]);
  useEffect(() => { loadEmails(); setSelectedId(null); setSelectedEmail(null); setSelectedIds(new Set()); }, [loadEmails]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (showCompose || showSettings) return;
      const idx = emails.findIndex(em => em.id === selectedId);
      switch (e.key) {
        case 'j': case 'ArrowDown': e.preventDefault(); if (idx < emails.length - 1) openEmail(emails[idx + 1].id); else if (idx === -1 && emails.length) openEmail(emails[0].id); break;
        case 'k': case 'ArrowUp': e.preventDefault(); if (idx > 0) openEmail(emails[idx - 1].id); break;
        case 'Enter': case 'o': if (selectedId && !selectedEmail) { e.preventDefault(); openEmail(selectedId); } break;
        case 's': if (selectedId) { e.preventDefault(); handleAction(selectedId, selectedEmail?.is_starred ? 'unstar' : 'star'); } break;
        case 'e': if (selectedId) { e.preventDefault(); handleAction(selectedId, 'move', 'archive'); toast(t('archive')); } break;
        case '#': if (selectedId) { e.preventDefault(); handleDelete(selectedId); } break;
        case 'r': if (selectedEmail) { e.preventDefault(); handleReply(selectedEmail); } break;
        case 'c': e.preventDefault(); setReplyTo(null); setShowCompose(true); break;
        case '/': e.preventDefault(); document.querySelector('[data-testid="search-input"]')?.focus(); break;
        case 'Escape': e.preventDefault(); setSelectedId(null); setSelectedEmail(null); setShowCompose(false); setShowSettings(false); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [emails, selectedId, selectedEmail, showCompose, showSettings]);

  const openEmail = async (id) => {
    setSelectedId(id);
    const em = emails.find(e => e.id === id);
    if (em) setEmails(prev => prev.map(e => e.id === id ? { ...e, is_read: true } : e));
    try {
      const d = await api.get(`/api/mail/emails/${id}`);
      setSelectedEmail(d);
      loadFolders();
    } catch {}
  };

  const handleAction = async (id, action, target) => {
    setEmails(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (action === 'star') return { ...e, is_starred: true };
      if (action === 'unstar') return { ...e, is_starred: false };
      if (action === 'read') return { ...e, is_read: true };
      if (action === 'unread') return { ...e, is_read: false };
      return e;
    }));
    if (['trash', 'spam', 'move'].includes(action)) {
      setEmails(prev => prev.filter(e => e.id !== id));
      if (id === selectedId) { setSelectedId(null); setSelectedEmail(null); }
    }
    if (selectedEmail?.id === id) {
      if (action === 'star') setSelectedEmail(p => ({ ...p, is_starred: true }));
      if (action === 'unstar') setSelectedEmail(p => ({ ...p, is_starred: false }));
      if (action === 'read') setSelectedEmail(p => ({ ...p, is_read: true }));
      if (action === 'unread') setSelectedEmail(p => ({ ...p, is_read: false }));
    }
    try {
      await api.post(`/api/mail/emails/${id}/action`, { action, target_folder: target });
      emailCache.current.clear();
      loadFolders();
    } catch {}
  };

  const handleBulkAction = async (action, target) => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    if (['trash', 'spam', 'move'].includes(action)) {
      setEmails(prev => prev.filter(e => !selectedIds.has(e.id)));
      if (selectedIds.has(selectedId)) { setSelectedId(null); setSelectedEmail(null); }
    }
    if (action === 'read') setEmails(prev => prev.map(e => selectedIds.has(e.id) ? { ...e, is_read: true } : e));
    setSelectedIds(new Set());
    try {
      await api.post('/api/mail/bulk-action', { ids, action, target_folder: target });
      emailCache.current.clear();
      loadFolders();
      loadEmails();
    } catch {}
    toast(`${ids.length} ${t('messages')} updated`);
  };

  const handleDelete = async (id) => {
    const original = emails.find(e => e.id === id);
    setEmails(prev => prev.filter(e => e.id !== id));
    if (id === selectedId) { setSelectedId(null); setSelectedEmail(null); }
    try { await api.del(`/api/mail/emails/${id}`); emailCache.current.clear(); loadFolders(); } catch {}
    toast(t('delete_email'), {
      label: t('undo'),
      fn: async () => {
        if (original) {
          try { await api.post(`/api/mail/emails/${id}/action`, { action: 'move', target_folder: original.folder }); emailCache.current.clear(); loadEmails(); loadFolders(); } catch {}
        }
      }
    });
  };

  const handleCompose = async (data) => {
    try {
      await api.post('/api/mail/compose', data);
      setShowCompose(false); setReplyTo(null);
      emailCache.current.clear(); loadEmails(); loadFolders();
      toast(t('message_sent'), { label: t('undo'), fn: () => {} });
    } catch {}
  };

  const handleReply = (email) => { setReplyTo(email); setShowCompose(true); };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === emails.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(emails.map(e => e.id)));
  };

  return (
    <div className="h-screen flex overflow-hidden bg-white" data-testid="mail-dashboard">
      <Sidebar
        folders={folders} labels={labels} activeFolder={activeFolder}
        onFolderChange={(f) => { setActiveFolder(f); setActiveCategory(''); setSearch(''); }}
        onCompose={() => { setReplyTo(null); setShowCompose(true); }}
        onSettings={() => setShowSettings(true)}
      />
      <div className="flex-1 flex flex-col border-s border-[var(--c-border)] overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <EmailList
            emails={emails} selectedId={selectedId} selectedIds={selectedIds}
            search={search} onSearchChange={setSearch} onSelect={openEmail}
            onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll}
            activeFolder={activeFolder} activeCategory={activeCategory}
            onCategoryChange={setActiveCategory} onBulkAction={handleBulkAction}
            onAction={handleAction}
          />
          <div className="flex-1 border-s border-[var(--c-border)] overflow-hidden">
            <EmailView email={selectedEmail} labels={labels} onReply={handleReply} onAction={handleAction} onDelete={handleDelete} />
          </div>
        </div>
      </div>
      {showCompose && <ComposeModal onClose={() => { setShowCompose(false); setReplyTo(null); }} onSend={handleCompose} replyTo={replyTo} />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
