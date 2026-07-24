import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, Link2, LayoutDashboard, Star, FolderTree, Share2, Clock, Archive, Settings, CornerDownLeft,
} from 'lucide-react';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useSaveLink } from '@/hooks/useLinks';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearch } from '@/hooks/useLinks';

const isUrl = (str: string) => /^https?:\/\/.+\..+/.test(str.trim());

const STATIC_COMMANDS = [
  { label: 'Go to Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Go to All Links', to: '/links', icon: Link2 },
  { label: 'Go to Favorites', to: '/favorites', icon: Star },
  { label: 'Go to Collections', to: '/collections', icon: FolderTree },
  { label: 'Go to Graph View', to: '/graph', icon: Share2 },
  { label: 'Go to Read Later', to: '/read-later', icon: Clock },
  { label: 'Go to Archive', to: '/archive', icon: Archive },
  { label: 'Go to Settings', to: '/settings', icon: Settings },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const saveLink = useSaveLink();
  const debouncedQuery = useDebounce(query, 300);
  const { data: searchResults } = useSearch(isUrl(query) ? '' : debouncedQuery);

  useKeyboardShortcut({ key: 'k', meta: true }, () => setOpen((o) => !o));
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery('');
  }, [open]);

  const filteredCommands = STATIC_COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSubmitUrl = async () => {
    if (!isUrl(query)) return;
    await saveLink.mutateAsync({ url: query.trim() });
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[12vh]"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card w-full max-w-xl overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && isUrl(query) && handleSubmitUrl()}
                placeholder="Paste a URL to save, or search your brain..."
                className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">ESC</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {isUrl(query) && (
                <button
                  onClick={handleSubmitUrl}
                  disabled={saveLink.isPending}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm hover:bg-white/[0.05]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 text-accent-300">
                    <Link2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-100">
                      {saveLink.isPending ? 'Saving & analyzing with AI…' : 'Save this URL to BrainVault'}
                    </p>
                    <p className="truncate text-xs text-slate-500">{query}</p>
                  </div>
                  <CornerDownLeft className="h-3.5 w-3.5 text-slate-600" />
                </button>
              )}

              {!isUrl(query) && query && searchResults?.data?.links?.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-slate-600">Links</p>
                  {searchResults.data.links.slice(0, 5).map((l: any) => (
                    <button
                      key={l._id}
                      onClick={() => { navigate(`/links?linkId=${l._id}`); setOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/[0.05]"
                    >
                      <img src={l.favicon} className="h-4 w-4 rounded" onError={(e: any) => (e.target.style.visibility = 'hidden')} />
                      <span className="truncate text-slate-200">{l.title}</span>
                    </button>
                  ))}
                </>
              )}

              {!isUrl(query) && (
                <>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-slate-600">Navigate</p>
                  {filteredCommands.map((c) => (
                    <button
                      key={c.to}
                      onClick={() => { navigate(c.to); setOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/[0.05]"
                    >
                      <c.icon className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-200">{c.label}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}