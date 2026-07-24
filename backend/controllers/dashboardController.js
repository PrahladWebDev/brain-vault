import Link from '../models/Link.js';
import Collection from '../models/Collection.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const baseMatch = { user: userId, isDeleted: false };

  const [
    totalLinks, favorites, archivedCount, brokenCount, collectionsCount,
    recentlyAdded, byDomain, byCategory, weeklyActivity,
  ] = await Promise.all([
    Link.countDocuments({ ...baseMatch, isArchived: false }),
    Link.countDocuments({ ...baseMatch, isFavorite: true }),
    Link.countDocuments({ ...baseMatch, isArchived: true }),
    Link.countDocuments({ ...baseMatch, 'linkStatus.isBroken': true }),
    Collection.countDocuments({ user: userId }),
    Link.find({ ...baseMatch, isArchived: false }).sort('-createdAt').limit(8)
      .select('title thumbnail favicon domain createdAt contentType category'),
    Link.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Link.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Link.aggregate([
      { $match: { ...baseMatch, createdAt: { $gte: new Date(Date.now() - 84 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const readLaterCounts = await Link.aggregate([
    { $match: { ...baseMatch, 'readLater.enabled': true } },
    { $group: { _id: '$readLater.status', count: { $sum: 1 } } },
  ]);

  const totalReadingMinutes = await Link.aggregate([
    { $match: baseMatch },
    { $group: { _id: null, total: { $sum: '$readingTimeMinutes' } } },
  ]);

  // "Knowledge growth" = cumulative links over the last 12 weeks
  const twelveWeeksAgo = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000);
  const growthRaw = await Link.aggregate([
    { $match: { ...baseMatch, createdAt: { $gte: twelveWeeksAgo } } },
    {
      $group: {
        _id: { $week: '$createdAt' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  let cumulative = 0;
  const knowledgeGrowth = growthRaw.map((w) => {
    cumulative += w.count;
    return { week: w._id, newLinks: w.count, total: cumulative };
  });

  res.json({
    success: true,
    data: {
      totals: {
        totalLinks,
        favorites,
        archived: archivedCount,
        brokenLinks: brokenCount,
        collections: collectionsCount,
        totalReadingMinutes: totalReadingMinutes[0]?.total || 0,
      },
      recentlyAdded,
      domains: byDomain.filter((d) => d._id).map((d) => ({ domain: d._id, count: d.count })),
      categories: byCategory.map((c) => ({ category: c._id, count: c.count })),
      weeklyActivity: weeklyActivity.map((w) => ({ date: w._id, count: w.count })),
      readingProgress: Object.fromEntries(readLaterCounts.map((r) => [r._id, r.count])),
      readingStreak: req.user.stats?.readingStreak || 0,
      knowledgeGrowth,
    },
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const baseMatch = { user: userId, isDeleted: false };

  const [mostSavedDomains, mostUsedTags, categoryDistribution, monthlyGrowth] = await Promise.all([
    Link.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    Link.aggregate([
      { $match: baseMatch },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    Link.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    Link.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totalReadingTime = await Link.aggregate([
    { $match: baseMatch },
    { $group: { _id: '$contentType', totalMinutes: { $sum: '$readingTimeMinutes' } } },
  ]);

  res.json({
    success: true,
    data: {
      mostSavedDomains: mostSavedDomains.filter((d) => d._id).map((d) => ({ domain: d._id, count: d.count })),
      mostUsedTags: mostUsedTags.map((t) => ({ tag: t._id, count: t.count })),
      categoryDistribution: categoryDistribution.map((c) => ({ category: c._id, count: c.count })),
      monthlyGrowth: monthlyGrowth.map((m) => ({ month: m._id, count: m.count })),
      readingTimeByType: totalReadingTime.map((t) => ({ contentType: t._id, totalMinutes: t.totalMinutes })),
    },
  });
});

export default { getDashboard, getAnalytics };
