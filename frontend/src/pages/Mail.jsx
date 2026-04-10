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
  const [activeLabel, setActiveLabel] = useState('');
  const [emails, setEmails] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const cache = useRef({});

  // Load all data on mount
  useEffect(() => {
    api.get('/api/mail/folders').then(d => setFolders(d.folders)).catch(() => {});
    api.get('/api/mail/labels').then(d => setLabels(d.labels)).catch(() => {});
    // Preload all folders
    ['inbox','sent','drafts','trash','spam','starred'].forEach(f => {
      api.get(`/api/mail/emails?folder=${f}`).then(d => { cache.current[f] = d.emails; }).catch(() => {});
    });
  }, []);

  const loadEmails = useCallback(() => {
    const catQ = activeCategory ? `&category=${activeCategory}` : '';
    const searchQ = search ? `&search=${encodeURIComponent(search)}` : '';
    const key = `${activeFolder}${catQ}${searchQ}`;
    // Show cached instantly
    if (cache.current[key]) setEmails(cache.current[key]);
    api.get(`/api/mail/emails?folder=${activeFolder}${catQ}${searchQ}`).then(d => {
      cache.current[key] = d.emails;
      // Filter by label client-side if label is active
      let filtered = d.emails;
      if (activeLabel) {
        filtered = filtered.filter(e => (e.labels || []).includes(activeLabel));
      }
      setEmails(filtered);
    }).catch(() => {});
  }, [activeFolder, activeCategory, search, activeLabel]);

  useEffect(() => {
    setSelectedId(null);
    setSelectedEmail(null);
    setSelectedIds(new Set());
    // Instant switch from cache
    const key = activeFolder;
    if (cache.current[key] && !search && !activeCategory) {
      let filtered = cache.current[key];
      if (activeLabel) filtered = filtered.filter(e => (e.labels || []).includes(activeLabel));
      setEmails(filtered);
    }
    loadEmails();
  }, [activeFolder, activeCategory, search, activeLabel, loadEmails]);

  const refreshFolders = () => api.get('/api/mail/folders').then(d => setFolders(d.folders)).catch(() => {});

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (showCompose || showSettings) return;
      const idx = emails.findIndex(em => em.id === selectedId);
      switch (e.key) {
        case 'j': case 'ArrowDown': e.preventDefault(); if (idx < emails.length - 1) openEmail(emails[idx + 1].id); else if (idx === -1 && emails.length) openEmail(emails[0].id); break;
        case 'k': case 'ArrowUp': e.preventDefault(); if (idx > 0) openEmail(emails[idx - 1].id); break;
        case 's': if (selectedId) { e.preventDefault(); handleAction(selectedId, selectedEmail?.is_starred ? 'unstar' : 'star'); } break;
        case 'e': if (selectedId) { e.preventDefault(); handleAction(selectedId, 'move', 'archive'); toast(t('archive')); } break;
        case '#': if (selectedId) { e.preventDefault(); handleDelete(selectedId); } break;
        case 'r': if (selectedEmail) { e.preventDefault(); handleReply(selectedEmail); } break;
        case 'c': e.preventDefault(); setReplyTo(null); setShowCompose(true); break;
        case '/': e.preventDefault(); document.querySelector('[data-testid="search-input"]')?.focus(); break;
        case 'Escape': setSelectedId(null); setSelectedEmail(null); setShowCompose(false); setShowSettings(false); break;
        default: break;
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [emails, selectedId, selectedEmail, showCompose, showSettings]);

  const openEmail = (id) => {
    setSelectedId(id);
    // Optimistic read
    setEmails(p => p.map(e => e.id === id ? { ...e, is_read: true } : e));
    api.get(`/api/mail/emails/${id}`).then(d => { setSelectedEmail(d); refreshFolders(); }).catch(() => {});
  };

  const handleAction = (id, action, target) => {
    // Optimistic update
    setEmails(p => {
      let next = p;
      if (action === 'star') next = p.map(e => e.id === id ? { ...e, is_starred: true } : e);
      else if (action === 'unstar') next = p.map(e => e.id === id ? { ...e, is_starred: false } : e);
      else if (action === 'read') next = p.map(e => e.id === id ? { ...e, is_read: true } : e);
      else if (action === 'unread') next = p.map(e => e.id === id ? { ...e, is_read: false } : e);
      else if (['trash', 'spam', 'move'].includes(action)) {
        next = p.filter(e => e.id !== id);
        if (id === selectedId) { setSelectedId(null); setSelectedEmail(null); }
      }
      return next;
    });
    if (selectedEmail?.id === id) {
      if (action === 'star') setSelectedEmail(p => p ? { ...p, is_starred: true } : p);
      if (action === 'unstar') setSelectedEmail(p => p ? { ...p, is_starred: false } : p);
    }
    api.post(`/api/mail/emails/${id}/action`, { action, target_folder: target }).then(() => { cache.current = {}; refreshFolders(); }).catch(() => {});
  };

  const handleBulkAction = (action, target) => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    if (['trash', 'spam', 'move'].includes(action)) setEmails(p => p.filter(e => !selectedIds.has(e.id)));
    if (action === 'read') setEmails(p => p.map(e => selectedIds.has(e.id) ? { ...e, is_read: true } : e));
    setSelectedIds(new Set());
    api.post('/api/mail/bulk-action', { ids, action, target_folder: target }).then(() => { cache.current = {}; refreshFolders(); }).catch(() => {});
    toast(`${ids.length} ${t('messages')} updated`);
  };

  const handleDelete = (id) => {
    setEmails(p => p.filter(e => e.id !== id));
    if (id === selectedId) { setSelectedId(null); setSelectedEmail(null); }
    api.del(`/api/mail/emails/${id}`).then(() => { cache.current = {}; refreshFolders(); }).catch(() => {});
    toast(t('delete_email'));
  };

  const handleCompose = (data) => {
    api.post('/api/mail/compose', data).then(() => {
      setShowCompose(false); setReplyTo(null); cache.current = {}; loadEmails(); refreshFolders();
      toast(t('message_sent'));
    }).catch(() => {});
  };

  const handleReply = (email) => { setReplyTo(email); setShowCompose(true); };

  const toggleSelect = (id) => setSelectedIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => selectedIds.size === emails.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(emails.map(e => e.id)));

  const switchFolder = (f) => { setActiveFolder(f); setActiveCategory(''); setActiveLabel(''); setSearch(''); };
  const switchLabel = (labelId) => { setActiveFolder('inbox'); setActiveCategory(''); setActiveLabel(labelId === activeLabel ? '' : labelId); setSearch(''); };

  return (
    <div className="h-screen flex overflow-hidden bg-white" data-testid="mail-dashboard">
      <Sidebar
        folders={folders} labels={labels} activeFolder={activeFolder} activeLabel={activeLabel}
        onFolderChange={switchFolder} onLabelChange={switchLabel}
        onCompose={() => { setReplyTo(null); setShowCompose(true); }}
        onSettings={() => setShowSettings(true)}
      />
      <div className="flex-1 flex border-s border-slate-200 overflow-hidden">
        <EmailList
          emails={emails} selectedId={selectedId} selectedIds={selectedIds}
          search={search} onSearchChange={setSearch} onSelect={openEmail}
          onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll}
          activeFolder={activeFolder} activeCategory={activeCategory}
          onCategoryChange={setActiveCategory} onBulkAction={handleBulkAction}
          onAction={handleAction}
        />
        <div className="flex-1 border-s border-slate-200 overflow-hidden">
          <EmailView email={selectedEmail} labels={labels} onReply={handleReply} onAction={handleAction} onDelete={handleDelete} />
        </div>
      </div>
      {showCompose && <ComposeModal onClose={() => { setShowCompose(false); setReplyTo(null); }} onSend={handleCompose} replyTo={replyTo} />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
