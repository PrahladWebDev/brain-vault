import { useState } from 'react';
import { useGraph } from '@/hooks/useLinks';
import GraphCanvas from '@/components/graph/GraphCanvas';
import PageHeader from '@/components/ui/PageHeader';
import { Search } from 'lucide-react';

export default function GraphPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { data, isLoading } = useGraph({ search: search || undefined, category: category || undefined });

  const nodes = data?.data?.nodes || [];
  const edges = data?.data?.edges || [];
  const categories = Array.from(new Set(nodes.map((n: any) => n.category))) as string[];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Graph View" subtitle="Your knowledge, visualized as a connected brain" />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search nodes…" className="input-field pl-9 !py-2" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategory('')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${!category ? 'bg-accent-500/20 text-accent-300' : 'bg-white/[0.04] text-slate-500'}`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${category === c ? 'bg-accent-500/20 text-accent-300' : 'bg-white/[0.04] text-slate-500'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="skeleton h-[420px] w-full rounded-2xl sm:h-[500px] lg:h-[620px]" />
      ) : nodes.length === 0 ? (
        <div className="glass-card flex h-[300px] items-center justify-center px-4 text-center text-sm text-slate-500 sm:h-[400px]">
          Save a few links to see your knowledge graph come alive.
        </div>
      ) : (
        <GraphCanvas nodes={nodes as any} edges={edges as any} />
      )}

      <p className="mt-3 text-center text-xs text-slate-600">
        Scroll to zoom · Drag background to pan · Drag a node to reposition · Click a node to open it
      </p>
    </div>
  );
}
