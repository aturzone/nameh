import { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { X, Globe, Type, FileSignature, Keyboard, Tag, Plus, Trash2, Sun, Moon } from 'lucide-react';
import api from '../services/api';

const FONTS = [
  { id: 'dm-sans', name: 'DM Sans', family: "'DM Sans', sans-serif" },
  { id: 'manrope', name: 'Manrope', family: "'Manrope', sans-serif" },
  { id: 'vazirmatn', name: 'Vazirmatn', family: "'Vazirmatn', 'Tahoma', sans-serif" },
];

const SHORTCUTS = [
  ['j / k', 'kb_navigate'], ['Enter', 'kb_open'], ['s', 'kb_star'],
  ['e', 'kb_archive'], ['#', 'kb_delete'], ['r', 'kb_reply'],
  ['c', 'kb_compose'], ['/', 'kb_search'], ['x', 'kb_select'], ['Esc', 'kb_esc'],
  ['?', 'kb_shortcuts_hint'],
];

const PRESET_COLORS = ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1', '#A855F7', '#D946EF'];

export default function Settings({ onClose, labels, onLabelsChange }) {
  const { t, lang, switchLang } = useI18n();
  const [settings, setSettings] = useState({ language: lang, font: 'dm-sans', signature: '', theme: 'light' });
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('general');
  const [editLabels, setEditLabels] = useState([]);
  const [newLabel, setNewLabel] = useState({ name: '', color: '#3B82F6' });

  useEffect(() => {
    api.get('/api/users/settings').then(s => {
      setSettings(s);
      if (s.language && s.language !== lang) switchLang(s.language);
      if (s.font) document.body.setAttribute('data-font', s.font);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setEditLabels(labels.map(l => ({ ...l })));
  }, [labels]);

  const save = async () => {
    try {
      await api.patch('/api/users/settings', settings);
      switchLang(settings.language);
      document.body.setAttribute('data-font', settings.font);
      document.documentElement.setAttribute('data-theme', settings.theme);
      localStorage.setItem('nameh_theme', settings.theme);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const saveLabels = async () => {
    try {
      const currentIds = new Set(labels.map(l => l.id));
      const editIds = new Set(editLabels.map(l => l.id));
      for (const lb of labels) {
        if (!editIds.has(lb.id)) {
          await api.del(`/api/mail/labels/${lb.id}`);
        }
      }
      for (const lb of editLabels) {
        if (!currentIds.has(lb.id)) {
          await api.post('/api/mail/labels', { name: lb.name, color: lb.color });
        }
      }
      if (onLabelsChange) onLabelsChange();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const addLabel = () => {
    if (!newLabel.name.trim()) return;
    const id = `lbl-new-${Date.now()}`;
    setEditLabels(p => [...p, { id, name: newLabel.name, color: newLabel.color }]);
    setNewLabel({ name: '', color: '#3B82F6' });
  };

  const removeLabel = (id) => setEditLabels(p => p.filter(l => l.id !== id));
  const updateLabel = (id, field, val) => setEditLabels(p => p.map(l => l.id === id ? { ...l, [field]: val } : l));

  const toggleTheme = () => {
    const next = settings.theme === 'dark' ? 'light' : 'dark';
    setSettings({ ...settings, theme: next });
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('nameh_theme', next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose} data-testid="settings-overlay">
      <div className="bg-[var(--c-bg)] rounded-xl shadow-2xl w-[580px] max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} data-testid="settings-panel">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--c-border)] shrink-0">
          <h2 className="font-heading text-lg font-bold text-[var(--c-text)]">{t('settings')}</h2>
          <button data-testid="settings-close-btn" onClick={onClose} className="p-1 text-[var(--c-text2)] hover:text-[var(--c-text)]"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex border-b border-[var(--c-border)] shrink-0">
          <SettingsTab icon={Globe} label={t('general')} active={tab === 'general'} onClick={() => setTab('general')} />
          <SettingsTab icon={Tag} label={t('labels_tab')} active={tab === 'labels'} onClick={() => setTab('labels')} />
          <SettingsTab icon={Keyboard} label={t('keyboard_shortcuts')} active={tab === 'shortcuts'} onClick={() => setTab('shortcuts')} />
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'general' && (
            <div className="space-y-5">
              <SettingsRow icon={Globe} label={t('language')}>
                <select data-testid="language-select" value={settings.language} onChange={e => setSettings({ ...settings, language: e.target.value })}
                  className="px-3 py-1.5 border border-[var(--c-border)] rounded-lg text-sm bg-[var(--c-bg)] text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]">
                  <option value="en">{t('english')}</option>
                  <option value="fa">{t('persian')}</option>
                </select>
              </SettingsRow>
              <SettingsRow icon={Type} label={t('font')}>
                <select data-testid="font-select" value={settings.font} onChange={e => setSettings({ ...settings, font: e.target.value })}
                  className="px-3 py-1.5 border border-[var(--c-border)] rounded-lg text-sm bg-[var(--c-bg)] text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]">
                  {FONTS.map(f => <option key={f.id} value={f.id} style={{ fontFamily: f.family }}>{f.name}</option>)}
                </select>
              </SettingsRow>
              <SettingsRow icon={settings.theme === 'dark' ? Moon : Sun} label={t('appearance')}>
                <button data-testid="theme-toggle" onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-1.5 border border-[var(--c-border)] rounded-lg text-sm bg-[var(--c-bg)] text-[var(--c-text)] hover:bg-[var(--c-bg3)]">
                  {settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  {settings.theme === 'dark' ? t('dark') : t('light')}
                </button>
              </SettingsRow>
              <SettingsRow icon={FileSignature} label={t('signature')} vertical>
                <textarea data-testid="signature-input" value={settings.signature} onChange={e => setSettings({ ...settings, signature: e.target.value })}
                  rows={3} placeholder="Your email signature..." className="w-full px-3 py-2 border border-[var(--c-border)] rounded-lg text-sm resize-none bg-[var(--c-bg)] text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]" />
              </SettingsRow>
            </div>
          )}

          {tab === 'labels' && (
            <div className="space-y-4">
              {editLabels.length === 0 && (
                <p className="text-sm text-[var(--c-text2)] text-center py-4">{t('no_labels')}</p>
              )}
              {editLabels.map(lb => (
                <div key={lb.id} className="flex items-center gap-3 group" data-testid={`label-edit-${lb.id}`}>
                  <input type="color" value={lb.color} onChange={e => updateLabel(lb.id, 'color', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-[var(--c-border)] cursor-pointer p-0.5" data-testid={`label-color-${lb.id}`} />
                  <input type="text" value={lb.name} onChange={e => updateLabel(lb.id, 'name', e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-[var(--c-border)] rounded-lg text-sm bg-[var(--c-bg)] text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]"
                    data-testid={`label-name-${lb.id}`} />
                  <div className="flex gap-1">
                    {PRESET_COLORS.slice(0, 6).map(c => (
                      <button key={c} onClick={() => updateLabel(lb.id, 'color', c)}
                        className={`w-5 h-5 rounded-full border-2 ${lb.color === c ? 'border-[var(--c-text)]' : 'border-transparent'}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                  <button onClick={() => removeLabel(lb.id)} data-testid={`label-delete-${lb.id}`}
                    className="p-1.5 text-[var(--c-text3)] hover:text-[var(--c-danger)] rounded-lg hover:bg-[var(--c-bg3)]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="border-t border-[var(--c-border)] pt-4 mt-4">
                <p className="text-xs font-semibold text-[var(--c-text2)] uppercase tracking-wider mb-3">{t('add_label')}</p>
                <div className="flex items-center gap-3">
                  <input type="color" value={newLabel.color} onChange={e => setNewLabel({ ...newLabel, color: e.target.value })}
                    className="w-8 h-8 rounded-lg border border-[var(--c-border)] cursor-pointer p-0.5" data-testid="new-label-color" />
                  <input type="text" value={newLabel.name} onChange={e => setNewLabel({ ...newLabel, name: e.target.value })}
                    placeholder={t('label_name')} data-testid="new-label-name"
                    className="flex-1 px-3 py-1.5 border border-[var(--c-border)] rounded-lg text-sm bg-[var(--c-bg)] text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]"
                    onKeyDown={e => e.key === 'Enter' && addLabel()} />
                  <button onClick={addLabel} data-testid="add-label-btn"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--c-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--c-accent-hover)]">
                    <Plus className="w-4 h-4" /> {t('add_label')}
                  </button>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setNewLabel({ ...newLabel, color: c })}
                      className={`w-6 h-6 rounded-full border-2 ${newLabel.color === c ? 'border-[var(--c-text)] scale-110' : 'border-transparent hover:border-[var(--c-border2)]'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'shortcuts' && (
            <div className="space-y-2">
              <p className="text-sm text-[var(--c-text2)] mb-4">{t('kb_title')}</p>
              {SHORTCUTS.map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-[var(--c-border)]/50">
                  <span className="text-sm text-[var(--c-text)]">{t(desc)}</span>
                  <kbd className="text-xs">{key}</kbd>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-5 py-3 border-t border-[var(--c-border)] bg-[var(--c-bg2)] shrink-0">
          <button data-testid="settings-save-btn" onClick={tab === 'labels' ? saveLabels : save}
            className="px-5 py-2 bg-[var(--c-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--c-accent-hover)]">
            {saved ? t('saved') : t('save')}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--c-text2)] hover:text-[var(--c-text)]">{t('close')}</button>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 ${
        active ? 'text-[var(--c-accent)] border-[var(--c-accent)]' : 'text-[var(--c-text2)] border-transparent hover:text-[var(--c-text)]'}`}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function SettingsRow({ icon: Icon, label, children, vertical }) {
  return (
    <div className={vertical ? 'space-y-2' : 'flex items-center justify-between'}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[var(--c-text2)]" />
        <span className="text-sm font-medium text-[var(--c-text)]">{label}</span>
      </div>
      {children}
    </div>
  );
}
