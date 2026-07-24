import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, ExternalLink, Star, Pin, Archive, Trash2, Clock, Sparkles, Tag as TagIcon, Link2,
} from 'lucide-react';
import clsx from 'clsx';
import { useLink, useUpdateLink, useToggleFavorite, useTogglePin, useToggleArchive, useSoftDeleteLink, useSetReadLater } from '@/hooks/useLinks';
import { timeAgo, CONTENT_TYPE_LABELS, categoryColor } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';

export default function RightPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const linkId = searchParams.get('linkId') || undefined;
  const { data, isLoading } = useLink(linkId);
  const updateLink = useUpdateLink();
  const toggleFavorite = useToggleFavorite();
  const togglePin = useTogglePin();
  const toggleArchive = useToggleArchive();
  const softDelete = useSoftDeleteLink();
  const setReadLater = useSetReadLater();

  const [notes, setNotes] = useState('');
  const debouncedNotes = useDebounce(notes, 800);
  const [tab, setTab] = useState<'summary' | 'notes' | 'related'>('summary');

  const link = data?.data?.link;

  useEffect(() => {
    if (link) setNotes(link.notes || '');
  }, [link?._id]);

  useEffect(() => {
    if (link && debouncedNotes !== link.notes) {
      updateLink.mutate({ id: link._id, data: { notes: debouncedNotes } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNotes]);

  const close = () => setSearchParams((prev) => { prev.delete('linkId'); return prev; });

  return (
    <AnimatePresence>
      {linkId && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
          />
          <motion.aside
            initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed right-0 top-0 z-50 h-screen w-full max-w-md overflow-y-auto border-l border-white/[0.06] bg-base-900/95 backdrop-blur-2xl lg:static lg:z-auto"
          >
            {isLoading || !link ? (
              <div className="space-y-4 p-6">
                <div className="skeleton h-6 w-3/4" />
                <div className="skeleton h-40 w-full" />
                <div className="skeleton h-20 w-full" />
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Link Details</span>
                  <button onClick={close} className="rounded-lg p-1.5 hover:bg-white/[0.06]">
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5">
                  {link.thumbnail && (
                    <img src={link.thumbnail} className="mb-4 h-36 w-full rounded-xl object-cover" onError={(e: any) => (e.target.style.display = 'none')} />
                  )}

                  <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                    {link.favicon && <img src={link.favicon} className="h-4 w-4 rounded" />}
                    <span>{link.domain}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: categoryColor(link.category) }}
                    >
                      {CONTENT_TYPE_LABELS[link.contentType]}
                    </span>
                  </div>

                  <h2 className="mb-3 text-lg font-bold leading-snug text-slate-50">{link.title}</h2>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <a href={link.url} target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-1.5 text-xs">
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </a>
                    <button onClick={() => toggleFavorite.mutate(link._id)} className={clsx('btn-ghost !px-3 !py-1.5 text-xs', link.isFavorite && 'text-amber-400 border-amber-400/30')}>
                      <Star className={clsx('h-3.5 w-3.5', link.isFavorite && 'fill-amber-400')} /> Favorite
                    </button>
                    <button onClick={() => togglePin.mutate(link._id)} className={clsx('btn-ghost !px-3 !py-1.5 text-xs', link.isPinned && 'text-cyan-400 border-cyan-400/30')}>
                      <Pin className={clsx('h-3.5 w-3.5', link.isPinned && 'fill-cyan-400')} /> Pin
                    </button>
                    <button onClick={() => setReadLater.mutate({ id: link._id, data: { preset: 'tomorrow', enabled: !link.readLater?.enabled } })} className={clsx('btn-ghost !px-3 !py-1.5 text-xs', link.readLater?.enabled && 'text-emerald-400 border-emerald-400/30')}>
                      <Clock className={clsx('h-3.5 w-3.5', link.readLater?.enabled && 'fill-emerald-400')} /> Read Tomorrow
                    </button>
                    <button onClick={() => toggleArchive.mutate(link._id)} className={clsx('btn-ghost !px-3 !py-1.5 text-xs', link.isArchived && 'text-orange-400 border-orange-400/30')}>
                      <Archive className={clsx('h-3.5 w-3.5', link.isArchived && 'fill-orange-400')} /> {link.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button onClick={() => { softDelete.mutate(link._id); close(); }} className="btn-ghost !px-3 !py-1.5 text-xs text-red-400 hover:border-red-500/30">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>

                  <div className="mb-4 flex gap-1 rounded-xl bg-white/[0.03] p-1">
                    {(['summary', 'notes', 'related'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={clsx(
                          'flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-colors',
                          tab === t ? 'bg-accent-500/20 text-accent-300' : 'text-slate-500 hover:text-slate-300'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {tab === 'summary' && (
                    <div className="space-y-4 animate-fade-in">
                      <div>
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-accent-300">
                          <Sparkles className="h-3.5 w-3.5" /> AI Summary
                          <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[9px] uppercase text-slate-500">
                            {link.aiProvider === 'gemini' ? 'Gemini' : 'Local'}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-300">{link.aiSummaryShort}</p>
                      </div>
                      <div>
                        <p className="mb-1.5 text-xs font-semibold text-slate-400">Detailed Summary</p>
                        <p className="text-sm leading-relaxed text-slate-400">{link.aiSummaryDetailed}</p>
                      </div>
                      <div>
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                          <TagIcon className="h-3.5 w-3.5" /> Tags
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {link.tags?.map((tag) => <span key={tag} className="chip">{tag}</span>)}
                        </div>
                      </div>
                      {link.technologies?.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-xs font-semibold text-slate-400">Technologies</p>
                          <div className="flex flex-wrap gap-1.5">
                            {link.technologies.map((t) => (
                              <span key={t} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="glass-card p-3">
                          <p className="text-slate-500">Difficulty</p>
                          <p className="mt-0.5 font-medium capitalize text-slate-200">{link.difficulty}</p>
                        </div>
                        <div className="glass-card p-3">
                          <p className="text-slate-500">Reading time</p>
                          <p className="mt-0.5 font-medium text-slate-200">{link.readingTimeMinutes} min</p>
                        </div>
                      </div>
                      {link.relatedTopics?.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-xs font-semibold text-slate-400">Related Topics</p>
                          <div className="flex flex-wrap gap-1.5">
                            {link.relatedTopics.map((t) => (
                              <span key={t} className="text-xs text-slate-500">#{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-600">Saved {timeAgo(link.createdAt)}</p>
                    </div>
                  )}

                  {tab === 'notes' && (
                    <div className="animate-fade-in">
                      <p className="mb-2 text-xs text-slate-500">Markdown supported — headings, lists, checklists, code blocks, tables.</p>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={'## My notes\n\n- Key takeaway\n- [ ] Follow up on this'}
                        className="input-field min-h-[280px] font-mono text-xs leading-relaxed"
                      />
                    </div>
                  )}

                  {tab === 'related' && (
                    <div className="animate-fade-in space-y-2">
                      {data?.data?.manualRelated?.length ? (
                        data.data.manualRelated.map((r: any) => (
                          <a
                            key={r._id}
                            href={`?linkId=${r._id}`}
                            onClick={(e) => { e.preventDefault(); setSearchParams((prev) => { prev.set('linkId', r._id); return prev; }); }}
                            className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] p-2.5 hover:bg-white/[0.04]"
                          >
                            <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                            <span className="truncate text-sm text-slate-300">{r.title}</span>
                          </a>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          No manually-linked related items yet. Related links based on shared tags &amp; topics show up automatically in Graph view.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}