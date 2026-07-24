import { RotateCcw, Trash2 } from 'lucide-react';
import { useTrash, useEmptyTrash, useRestoreLink, usePermanentlyDeleteLink } from '@/hooks/useLinks';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { timeAgo } from '@/utils/format';

export default function Trash() {
  const { data, isLoading } = useTrash({ limit: 60 });
  const emptyTrash = useEmptyTrash();
  const restore = useRestoreLink();
  const permanentDelete = usePermanentlyDeleteLink();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Trash"
        subtitle="Deleted links are kept here until you empty the trash"
        action={
          data?.items?.length ? (
            <button
              onClick={() => { if (confirm('Permanently delete all items in trash?')) emptyTrash.mutate(); }}
              className="btn-ghost text-xs text-red-400 hover:border-red-500/30"
            >
              <Trash2 className="h-3.5 w-3.5" /> Empty Trash
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}
        </div>
      ) : !data?.items?.length ? (
        <EmptyState message="Trash is empty" />
      ) : (
        <div className="space-y-2">
          {data.items.map((link) => (
            <div key={link._id} className="glass-card flex flex-wrap items-center gap-3 p-3.5 sm:flex-nowrap sm:gap-4">
              {link.favicon && <img src={link.favicon} className="h-6 w-6 shrink-0 rounded" />}
              <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                <p className="truncate text-sm font-medium text-slate-200">{link.title}</p>
                <p className="truncate text-xs text-slate-500">{link.domain} · deleted {timeAgo(link.updatedAt)}</p>
              </div>
              <button onClick={() => restore.mutate(link._id)} className="btn-ghost !px-3 !py-1.5 text-xs shrink-0">
                <RotateCcw className="h-3.5 w-3.5" /> Restore
              </button>
              <button
                onClick={() => { if (confirm('Permanently delete this link?')) permanentDelete.mutate(link._id); }}
                className="btn-ghost !px-3 !py-1.5 text-xs shrink-0 text-red-400 hover:border-red-500/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
