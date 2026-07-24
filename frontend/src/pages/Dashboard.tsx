import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, BarChart, Bar, YAxis } from 'recharts';
import { Link2, Star, FolderTree, AlertTriangle, Clock, Flame } from 'lucide-react';
import { useDashboard } from '@/hooks/useLinks';
import SaveUrlBar from '@/components/links/SaveUrlBar';
import LinkCard from '@/components/links/LinkCard';
import PageHeader from '@/components/ui/PageHeader';
import { categoryColor } from '@/utils/format';

const STAT_CARDS = [
  { key: 'totalLinks', label: 'Total Links', icon: Link2, color: '#8b5cf6' },
  { key: 'favorites', label: 'Favorites', icon: Star, color: '#fbbf24' },
  { key: 'collections', label: 'Collections', icon: FolderTree, color: '#22d3ee' },
  { key: 'brokenLinks', label: 'Broken Links', icon: AlertTriangle, color: '#f87171' },
] as const;

export default function Dashboard() {
  const { data, isLoading } = useDashboard();
  const d = data?.data;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Dashboard" subtitle="Your knowledge, at a glance" />

      <div className="glass-card mb-6 p-4">
        <SaveUrlBar />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4"
          >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${s.color}22` }}>
              <s.icon className="h-4.5 w-4.5" style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-bold text-slate-50">
              {isLoading ? '—' : d?.totals[s.key as keyof typeof d.totals] ?? 0}
            </p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Weekly Activity</h3>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Flame className="h-3.5 w-3.5 text-orange-400" /> {d?.readingStreak || 0} day streak
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={d?.weeklyActivity || []}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#14141f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">Categories</h3>
          <div className="space-y-3">
            {(d?.categories || []).slice(0, 6).map((c) => {
              const max = Math.max(...(d?.categories.map((x) => x.count) || [1]));
              return (
                <div key={c.category}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-400">{c.category}</span>
                    <span className="text-slate-500">{c.count}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.count / max) * 100}%`, backgroundColor: categoryColor(c.category) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Recently Added</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(d?.recentlyAdded || []).map((link, i) => (
          <LinkCard key={link._id} link={link as any} index={i} />
        ))}
      </div>
    </div>
  );
}
