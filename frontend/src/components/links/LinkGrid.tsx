import LinkCard from './LinkCard';
import EmptyState from '@/components/ui/EmptyState';
import type { Link } from '@/types';

export default function LinkGrid({ links, loading, emptyLabel = 'No links yet' }: { links?: Link[]; loading: boolean; emptyLabel?: string }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card overflow-hidden">
            <div className="skeleton h-32 w-full rounded-none" />
            <div className="space-y-2 p-4">
              <div className="skeleton h-3 w-1/2" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!links || links.length === 0) {
    return <EmptyState message={emptyLabel} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {links.map((link, i) => (
        <LinkCard key={link._id} link={link} index={i} />
      ))}
    </div>
  );
}
