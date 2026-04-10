import { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { X, Globe, Type, FileSignature, Keyboard } from 'lucide-react';
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
];

export default function Settings({ onClose }) {
  const { t, lang, switchLang } = useI18n();
  const [settings, setSettings] = useState({ language: lang, font: 'dm-sans', signature: '', theme: 'light' });
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('general');

  useEffect(() => {
    api.get('/api/users/settings').then(s => {
      setSettings(s);
      if (s.language && s.language !== lang) switchLang(s.language);
      if (s.font) document.body.setAttribute('data-font', s.font);
    }).catch(() => {});
  }, []);

  const save = async () => {
    try {
      await api.patch('/api/users/settings', settings);
      switchLang(settings.language);
      document.body.setAttribute('data-font', settings.font);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose} data-testid="settings-overlay">
      <div className="bg-white rounded-xl shadow-2xl w-[560px] max-h-[80vh] overflow-hidden slide-up" onClick={e => e.stopPropagation()} data-testid="settings-panel">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--c-border)]">
          <h2 className="font-heading text-lg font-bold text-[var(--c-text)]">{t('settings')}</h2>
          <button data-testid="settings-close-btn" onClick={onClose} className="p-1 text-[var(--c-text2)] hover:text-[var(--c-text)] transition-fast"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex border-b border-[var(--c-border)]">
          <SettingsTab icon={Globe} label={t('general')} active={tab === 'general'} onClick={() => setTab('general')} />
          <SettingsTab icon={Keyboard} label={t('keyboard_shortcuts')} active={tab === 'shortcuts'} onClick={() => setTab('shortcuts')} />
        </div>

        <div className="p-5 overflow-y-auto max-h-[50vh]">
          {tab === 'general' && (
            <div className="space-y-5">
              <SettingsRow icon={Globe} label={t('language')}>
                <select data-testid="language-select" value={settings.language} onChange={e => setSettings({ ...settings, language: e.target.value })}
                  className="px-3 py-1.5 border border-[var(--c-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]">
                  <option value="en">{t('english')}</option>
                  <option value="fa">{t('persian')}</option>
                </select>
              </SettingsRow>
              <SettingsRow icon={Type} label={t('font')}>
                <select data-testid="font-select" value={settings.font} onChange={e => setSettings({ ...settings, font: e.target.value })}
                  className="px-3 py-1.5 border border-[var(--c-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]">
                  {FONTS.map(f => <option key={f.id} value={f.id} style={{ fontFamily: f.family }}>{f.name}</option>)}
                </select>
              </SettingsRow>
              <SettingsRow icon={FileSignature} label={t('signature')} vertical>
                <textarea data-testid="signature-input" value={settings.signature} onChange={e => setSettings({ ...settings, signature: e.target.value })}
                  rows={3} placeholder="Your email signature..." className="w-full px-3 py-2 border border-[var(--c-border)] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]" />
              </SettingsRow>
              <div className="flex items-center gap-3 pt-2">
                <button data-testid="settings-save-btn" onClick={save}
                  className="px-5 py-1.5 bg-[var(--c-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--c-accent-hover)] transition-fast">
                  {saved ? t('saved') : t('save')}
                </button>
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
      </div>
    </div>
  );
}

function SettingsTab({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-fast border-b-2 ${
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
