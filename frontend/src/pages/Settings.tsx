import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Download, Upload, Palette, Sliders, Type } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { applyAppearance } from '@/utils/appearance';
import PageHeader from '@/components/ui/PageHeader';

const ACCENTS = ['#8b5cf6', '#22d3ee', '#f472b6', '#fbbf24', '#34d399', '#60a5fa'];

export default function Settings() {
  const { user } = useAuth();
  const [accent, setAccent] = useState(user?.settings?.accentColor || '#8b5cf6');
  const [fontSize, setFontSize] = useState(user?.settings?.fontSize || 'md');
  const [linkDistance, setLinkDistance] = useState(user?.settings?.graphPhysics?.linkDistance || 90);
  const fileInput = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const pickAccent = (c: string) => {
    setAccent(c);
    applyAppearance({ accentColor: c, fontSize });
  };

  const pickFontSize = (s: string) => {
    setFontSize(s);
    applyAppearance({ accentColor: accent, fontSize: s });
  };

  const saveSettings = async () => {
    try {
      await api.patch('/auth/settings', {
        accentColor: accent,
        fontSize,
        graphPhysics: { ...user?.settings?.graphPhysics, linkDistance },
      });
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const exportData = (format: 'json' | 'csv' | 'markdown') => {
    window.open(`/api/export?format=${format}`, '_blank');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const html = await file.text();
      const res = await api.post('/import/bookmarks', { html });
      toast.success(res.message || 'Import complete');
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Settings" subtitle="Customize your BrainVault" />

      <div className="space-y-6">
        <section className="glass-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Palette className="h-4 w-4 text-accent-400" /> Appearance
          </div>
          <p className="mb-2 text-xs text-slate-500">Dark mode is on by default across BrainVault.</p>
          <p className="mb-2 text-xs font-medium text-slate-400">Accent Color</p>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c}
                onClick={() => pickAccent(c)}
                className="h-7 w-7 rounded-full transition-all"
                style={{ backgroundColor: c, boxShadow: accent === c ? `0 0 0 2px ${c}` : 'none' }}
              />
            ))}
          </div>
        </section>

        <section className="glass-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Type className="h-4 w-4 text-accent-400" /> Font Size
          </div>
          <div className="flex flex-wrap gap-2">
            {['sm', 'md', 'lg'].map((s) => (
              <button
                key={s}
                onClick={() => pickFontSize(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium uppercase ${fontSize === s ? 'bg-accent-500/20 text-accent-300' : 'bg-white/[0.04] text-slate-500'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        <section className="glass-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Sliders className="h-4 w-4 text-accent-400" /> Graph Physics
          </div>
          <label className="mb-1.5 block text-xs text-slate-500">Link distance: {linkDistance}</label>
          <input
            type="range" min={40} max={200} value={linkDistance}
            onChange={(e) => setLinkDistance(Number(e.target.value))}
            className="w-full accent-accent-500"
          />
        </section>

        <button onClick={saveSettings} className="btn-primary">Save Settings</button>

        <section className="glass-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Download className="h-4 w-4 text-accent-400" /> Export Data
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => exportData('json')} className="btn-ghost text-xs">Export as JSON</button>
            <button onClick={() => exportData('csv')} className="btn-ghost text-xs">Export as CSV</button>
            <button onClick={() => exportData('markdown')} className="btn-ghost text-xs">Export as Markdown</button>
          </div>
        </section>

        <section className="glass-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Upload className="h-4 w-4 text-accent-400" /> Import Bookmarks
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Import an exported bookmarks HTML file from Chrome, Firefox, or Edge (they all use the same format).
          </p>
          <input ref={fileInput} type="file" accept=".html,.htm" onChange={handleImportFile} className="hidden" />
          <button onClick={() => fileInput.current?.click()} disabled={importing} className="btn-ghost text-xs">
            {importing ? 'Importing…' : 'Choose bookmarks.html'}
          </button>
        </section>
      </div>
    </div>
  );
}
