import { useState } from 'react';
import clsx from 'clsx';
import { useLinks } from '@/hooks/useLinks';
import LinkGrid from '@/components/links/LinkGrid';
import PageHeader from '@/components/ui/PageHeader';

const STATUSES = [
  { key: '', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'reading', label: 'Reading' },
  { key: 'completed', label: 'Completed' },
  { key: 'archived', label: 'Archived' },
];

export default function ReadLater() {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useLinks({ view: 'read-later', readLaterStatus: status || undefined, limit: 60 });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Read Later" subtitle="Links you've queued up for later reading" />

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStatus(s.key)}
            className={clsx('rounded-full px-3 py-1.5 text-xs font-medium', status === s.key ? 'bg-accent-500/20 text-accent-300' : 'bg-white/[0.04] text-slate-500 hover:text-slate-300')}
          >
            {s.label}
          </button>
        ))}
      </div>

      <LinkGrid links={data?.items} loading={isLoading} emptyLabel="Nothing queued for later — mark a link as 'Read Tomorrow' from its detail panel" />
    </div>
  );
}
