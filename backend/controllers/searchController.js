import Link from '../models/Link.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseNaturalLanguageQuery } from '../services/aiService.js';

// GET /api/search?q=...&mode=nl|keyword
export const search = asyncHandler(async (req, res) => {
  const { q = '', mode = 'keyword', page = 1, limit = 20 } = req.query;
  if (!q.trim()) {
    return res.json({ success: true, data: { links: [], total: 0 } });
  }

  const baseMatch = { user: req.user._id, isDeleted: false };

  if (mode === 'nl') {
    const parsed = parseNaturalLanguageQuery(q);
    const orConditions = [];

    if (parsed.keywords.length) {
      orConditions.push({ tags: { $in: parsed.keywords } });
      orConditions.push({ keywords: { $in: parsed.keywords } });
      orConditions.push({ technologies: { $in: parsed.keywords } });
      orConditions.push({ title: { $regex: parsed.keywords.join('|'), $options: 'i' } });
    }
    if (parsed.contentType) {
      baseMatch.contentType = parsed.contentType;
    }
    if (orConditions.length) baseMatch.$or = orConditions;

    const links = await Link.find(baseMatch)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.json({
      success: true,
      data: { links, total: links.length, interpretedQuery: parsed },
    });
  }

  // Default: keyword / structured search across title, tag, domain, collection name, notes
  const regex = { $regex: q, $options: 'i' };
  const links = await Link.find({
    ...baseMatch,
    $or: [
      { title: regex },
      { description: regex },
      { notes: regex },
      { tags: regex },
      { domain: regex },
      { siteName: regex },
    ],
  })
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('collections', 'name color');

  res.json({ success: true, data: { links, total: links.length } });
});

export default { search };
