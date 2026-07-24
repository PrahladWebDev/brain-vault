import { motion } from 'framer-motion';
import { Star, Pin, Clock, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { useSearchParams } from 'react-router-dom';
import type { Link } from '@/types';
import { timeAgo, CONTENT_TYPE_LABELS, categoryColor } from '@/utils/format';
import { useToggleFavorite } from '@/hooks/useLinks';

export default function LinkCard({ link, index = 0 }: { link: Link; index?: number }) {
  const [, setSearchParams] = useSearchParams();
  const toggleFavorite = useToggleFavorite();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      onClick={() => setSearchParams((prev) => { prev.set('linkId', link._id); return prev; })}
      className="glass-card group relative cursor-pointer overflow-hidden p-0 transition-all hover:border-accent-500/30 hover:shadow-glow"
    >
      <div className="relative h-32 w-full overflow-hidden bg-base-800">
        {link.thumbnail ? (
          <img src={link.thumbnail} alt="" className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" onError={(e: any) => (e.target.style.display = 'none')} />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-3xl font-bold text-white/20"
            style={{ background: `linear-gradient(135deg, ${categoryColor(link.category)}33, transparent)` }}
          >
            {link.siteName?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base-900/90 via-transparent to-transparent" />
        <span
          className="absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md"
          style={{ backgroundColor: `${categoryColor(link.category)}bb` }}
        >
          {CONTENT_TYPE_LABELS[link.contentType]}
        </span>
        <div className="absolute right-2.5 top-2.5 flex gap-1.5">
          {link.isPinned && <Pin className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
          {link.linkStatus?.isBroken && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite.mutate(link._id); }}
          className="absolute bottom-2.5 right-2.5 rounded-full bg-black/40 p-1.5 backdrop-blur-md transition-colors hover:bg-black/60"
        >
          <Star className={clsx('h-3.5 w-3.5', link.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-white/70')} />
        </button>
      </div>

      <div className="p-4">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
          {link.favicon && <img src={link.favicon} className="h-3.5 w-3.5 rounded" onError={(e: any) => (e.target.style.visibility = 'hidden')} />}
          <span className="truncate">{link.domain}</span>
          <span>·</span>
          <span className="flex shrink-0 items-center gap-0.5"><Clock className="h-3 w-3" />{link.readingTimeMinutes}m</span>
        </div>

        <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-100">{link.title}</h3>
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-slate-400">{link.aiSummaryShort}</p>

        <div className="flex flex-wrap gap-1.5">
          {link.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="chip text-[10px]">{tag}</span>
          ))}
        </div>

        <p className="mt-3 text-[10px] text-slate-600">{timeAgo(link.createdAt)}</p>
      </div>
    </motion.div>
  );
}
