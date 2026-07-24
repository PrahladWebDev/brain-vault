import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Menu } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export default function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const [q, setQ] = useState('');
  const [nlMode, setNlMode] = useState(false);
  const navigate = useNavigate();
  const debounced = useDebounce(q, 400);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/links?q=${encodeURIComponent(q)}&mode=${nlMode ? 'nl' : 'keyword'}`);
  };

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-white/[0.06] bg-base-950/70 px-3 py-3 backdrop-blur-xl sm:gap-3 sm:px-6 sm:py-3.5">
      <button
        onClick={onMenuClick}
        className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <form onSubmit={onSubmit} className="relative max-w-xl flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={nlMode ? 'Ask naturally…' : 'Search…'}
          className="input-field pl-10 pr-14 sm:pr-16"
        />
        <button
          type="button"
          onClick={() => setNlMode((v) => !v)}
          className={`absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
            nlMode ? 'bg-accent-500/20 text-accent-300' : 'text-slate-600 hover:text-slate-400'
          }`}
          title="Toggle natural language search"
        >
          <Sparkles className="h-3 w-3" /> AI
        </button>
      </form>
    </header>
  );
}
