import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderTree, Plus, Trash2 } from 'lucide-react';
import { useCollections, useCreateCollection, useDeleteCollection } from '@/hooks/useLinks';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

const COLORS = ['#8b5cf6', '#22d3ee', '#f472b6', '#fbbf24', '#34d399', '#f97316', '#60a5fa', '#a78bfa'];

export default function Collections() {
  const { data, isLoading } = useCollections();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createCollection.mutateAsync({ name: name.trim(), color });
    setName('');
    setShowForm(false);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Collections"
        subtitle="Organize your knowledge into topics"
        action={
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
            <Plus className="h-4 w-4" /> New Collection
          </button>
        }
      />

      {showForm && (
        <form onSubmit={onCreate} className="glass-card mb-6 flex flex-wrap items-center gap-3 p-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Collection name (e.g. Machine Learning)"
            className="input-field flex-1"
          />
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className="h-6 w-6 rounded-full ring-offset-2 ring-offset-base-900 transition-all"
                style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }}
              />
            ))}
          </div>
          <button type="submit" className="btn-primary !py-2">Create</button>
        </form>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : !data?.data.collections.length ? (
        <EmptyState message="No collections yet" hint="Create one to start organizing your links" />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {data.data.collections.map((c) => (
            <div
              key={c._id}
              onClick={() => navigate(`/collections/${c._id}`)}
              className="glass-card group relative cursor-pointer p-4 transition-all hover:border-white/20"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${c.color}22` }}>
                <FolderTree className="h-4.5 w-4.5" style={{ color: c.color }} />
              </div>
              <p className="truncate text-sm font-semibold text-slate-100">{c.name}</p>
              <p className="text-xs text-slate-500">{c.linkCount || 0} links</p>
              {!c.isDefault && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteCollection.mutate(c._id); }}
                  className="absolute right-3 top-3 rounded-lg p-1 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
