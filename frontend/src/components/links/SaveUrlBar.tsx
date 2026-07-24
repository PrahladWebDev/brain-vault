import { useState, FormEvent } from 'react';
import { Plus, Loader2, Command } from 'lucide-react';
import { useSaveLink } from '@/hooks/useLinks';

export default function SaveUrlBar({ collectionId }: { collectionId?: string }) {
  const [url, setUrl] = useState('');
  const saveLink = useSaveLink();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    await saveLink.mutateAsync({ url: url.trim(), collections: collectionId ? [collectionId] : undefined });
    setUrl('');
  };

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste any URL — article, GitHub repo, YouTube, PDF…"
          className="input-field pr-16"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500 sm:flex">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </div>
      <button type="submit" disabled={saveLink.isPending || !url.trim()} className="btn-primary shrink-0">
        {saveLink.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Save
      </button>
    </form>
  );
}