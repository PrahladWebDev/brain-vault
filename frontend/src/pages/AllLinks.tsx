import { useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useLinks, useSearch, useCollections } from '@/hooks/useLinks';
import LinkGrid from '@/components/links/LinkGrid';
import SaveUrlBar from '@/components/links/SaveUrlBar';
import PageHeader from '@/components/ui/PageHeader';
import clsx from 'clsx';

const CONTENT_TYPES = ['article', 'blog', 'github', 'documentation', 'youtube', 'pdf', 'reddit', 'stackoverflow', 'twitter', 'linkedin', 'medium', 'devto'];

export default function AllLinks() {
  const [searchParams] = useSearchParams();
  const { id: collectionId } = useParams();
  const q = searchParams.get('q') || '';
  const mode = (searchParams.get('mode') as 'keyword' | 'nl') || 'keyword';
  const [page, setPage] = useState(1);
  const [contentType, setContentType] = useState('');

  const isSearching = q.trim().length > 1;
  const searchResult = useSearch(q, mode);
  const listResult = useLinks({ page, limit: 20, collection: collectionId, contentType });
  const { data: collectionsData } = useCollections();

  const collectionName = collectionId
    ? collectionsData?.data.collections.find((c) => c._id === collectionId)?.name
    : undefined;

  const links = isSearching ? searchResult.data?.data?.links : listResult.data?.items;
  const loading = isSearching ? searchResult.isLoading : listResult.isLoading;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={collectionName ? collectionName : isSearching ? `Results for "${q}"` : 'All Links'}
        subtitle={isSearching ? (mode === 'nl' ? 'AI-interpreted natural language search' : 'Keyword search') : 'Everything you’ve saved to your second brain'}
      />

      {!isSearching && (
        <div className="glass-card mb-5 p-4">
          <SaveUrlBar collectionId={collectionId} />
        </div>
      )}

      {!isSearching && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setContentType('')}
            className={clsx('rounded-full px-3 py-1.5 text-xs font-medium transition-colors', !contentType ? 'bg-accent-500/20 text-accent-300' : 'bg-white/[0.04] text-slate-500 hover:text-slate-300')}
          >
            All
          </button>
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct}
              onClick={() => setContentType(ct)}
              className={clsx('rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors', contentType === ct ? 'bg-accent-500/20 text-accent-300' : 'bg-white/[0.04] text-slate-500 hover:text-slate-300')}
            >
              {ct}
            </button>
          ))}
        </div>
      )}

      <LinkGrid links={links} loading={loading} emptyLabel={isSearching ? 'No matches found' : 'Save your first link to get started'} />

      {!isSearching && listResult.data && listResult.data.pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40">
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {listResult.data.pagination.page} of {listResult.data.pagination.totalPages}
          </span>
          <button
            disabled={page >= listResult.data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}