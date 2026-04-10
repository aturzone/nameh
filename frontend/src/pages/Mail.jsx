import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import EmailList from '../components/EmailList';
import EmailView from '../components/EmailView';
import ComposeModal from '../components/ComposeModal';
import api from '../services/api';

export default function Mail() {
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [emails, setEmails] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [rtl, setRtl] = useState(false);

  const loadFolders = useCallback(async () => {
    try {
      const data = await api.get('/api/mail/folders');
      setFolders(data.folders);
    } catch {}
  }, []);

  const loadEmails = useCallback(async () => {
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const data = await api.get(`/api/mail/emails?folder=${activeFolder}${q}`);
      setEmails(data.emails);
    } catch {}
  }, [activeFolder, search]);

  useEffect(() => { loadFolders(); }, [loadFolders]);
  useEffect(() => { loadEmails(); setSelectedId(null); setSelectedEmail(null); }, [loadEmails]);

  useEffect(() => {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  }, [rtl]);

  const openEmail = async (id) => {
    setSelectedId(id);
    try {
      const data = await api.get(`/api/mail/emails/${id}`);
      setSelectedEmail(data);
      loadFolders();
      loadEmails();
    } catch {}
  };

  const handleAction = async (id, action, targetFolder) => {
    try {
      await api.post(`/api/mail/emails/${id}/action`, { action, target_folder: targetFolder });
      loadEmails();
      loadFolders();
      if (id === selectedId) {
        setSelectedId(null);
        setSelectedEmail(null);
      }
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await api.del(`/api/mail/emails/${id}`);
      loadEmails();
      loadFolders();
      if (id === selectedId) { setSelectedId(null); setSelectedEmail(null); }
    } catch {}
  };

  const handleCompose = async (data) => {
    try {
      await api.post('/api/mail/compose', data);
      setShowCompose(false);
      setReplyTo(null);
      loadEmails();
      loadFolders();
    } catch {}
  };

  const handleReply = (email) => {
    setReplyTo(email);
    setShowCompose(true);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-white" data-testid="mail-dashboard">
      <Sidebar
        folders={folders}
        activeFolder={activeFolder}
        onFolderChange={(f) => { setActiveFolder(f); setSearch(''); }}
        onCompose={() => { setReplyTo(null); setShowCompose(true); }}
        rtl={rtl}
        onToggleRtl={() => setRtl(!rtl)}
      />

      <div className="flex-1 flex border-s border-nameh-border overflow-hidden">
        <EmailList
          emails={emails}
          selectedId={selectedId}
          search={search}
          onSearchChange={setSearch}
          onSelect={openEmail}
          activeFolder={activeFolder}
        />

        <div className="flex-1 border-s border-nameh-border overflow-hidden">
          <EmailView
            email={selectedEmail}
            onReply={handleReply}
            onAction={handleAction}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {showCompose && (
        <ComposeModal
          onClose={() => { setShowCompose(false); setReplyTo(null); }}
          onSend={handleCompose}
          replyTo={replyTo}
        />
      )}
    </div>
  );
}
