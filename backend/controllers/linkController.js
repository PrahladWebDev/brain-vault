import Link from '../models/Link.js';
import Tag from '../models/Tag.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { normalizeUrl } from '../utils/normalizeUrl.js';
import { extractMetadata } from '../services/metadataService.js';
import { analyzeContent } from '../services/aiService.js';
import { recomputeEdgesForLink } from '../services/graphService.js';
import { paginate } from '../repositories/linkRepository.js';

async function upsertTags(userId, tagNames = []) {
  const ops = tagNames.map((name) => ({
    updateOne: {
      filter: { user: userId, name: name.toLowerCase() },
      update: { $inc: { usageCount: 1 }, $setOnInsert: { user: userId, name: name.toLowerCase() } },
      upsert: true,
    },
  }));
  if (ops.length) await Tag.bulkWrite(ops, { ordered: false }).catch(() => {});
}

// POST /api/links  - Save a new URL (the core "magic" pipeline)
export const saveLink = asyncHandler(async (req, res) => {
  const { url, collections = [] } = req.body;
  const normalized = normalizeUrl(url);

  const existing = await Link.findOne({ user: req.user._id, normalizedUrl: normalized, isDeleted: false });
  if (existing) {
    return res.status(200).json({
      success: true,
      alreadySaved: true,
      message: 'This URL is already saved to your BrainVault',
      data: { link: existing },
    });
  }

  // A previously-deleted link with this URL may still occupy the unique
  // {user, normalizedUrl} index slot — restore & refresh it instead of
  // inserting a new document, which would throw a duplicate key error.
  const trashed = await Link.findOne({ user: req.user._id, normalizedUrl: normalized, isDeleted: true });

  const metadata = await extractMetadata(url);
  const ai = await analyzeContent({
    title: metadata.title,
    description: metadata.description,
    extractedText: metadata.extractedText,
    url,
    contentType: metadata.contentType,
  });

  const fields = {
    url,
    normalizedUrl: normalized,
    title: metadata.title,
    description: metadata.description,
    thumbnail: metadata.thumbnail,
    favicon: metadata.favicon,
    siteName: metadata.siteName,
    domain: metadata.domain,
    contentType: metadata.contentType,
    readingTimeMinutes: metadata.readingTimeMinutes,
    aiSummaryShort: ai.shortSummary,
    aiSummaryDetailed: ai.detailedSummary,
    keywords: ai.keywords,
    tags: ai.tags,
    category: ai.category,
    technologies: ai.technologies,
    difficulty: ai.difficulty,
    relatedTopics: ai.relatedTopics,
    aiProvider: ai.provider,
    collections,
    linkStatus: {
      isBroken: metadata.linkStatusCode ? metadata.linkStatusCode >= 400 : false,
      httpStatus: metadata.linkStatusCode || 200,
      lastCheckedAt: new Date(),
    },
  };

  let link;
  if (trashed) {
    Object.assign(trashed, fields, {
      isDeleted: false,
      deletedAt: null,
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      notes: '',
      readLater: { enabled: false, reminderAt: null, status: 'unread' },
    });
    link = await trashed.save();
  } else {
    link = await Link.create({ user: req.user._id, ...fields });
  }

  await upsertTags(req.user._id, ai.tags);
  await recomputeEdgesForLink(req.user._id, link);

  res.status(201).json({ success: true, data: { link } });
});

// GET /api/links
export const getLinks = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, sort = '-createdAt', category, tag, domain, collection,
    contentType, favorite, archived, readLaterStatus, view,
  } = req.query;

  const filter = { user: req.user._id, isDeleted: false };

  if (view === 'archive') filter.isArchived = true;
  else filter.isArchived = archived === 'true' ? true : false;

  if (category) filter.category = category;
  if (tag) filter.tags = tag;
  if (domain) filter.domain = domain;
  if (collection) filter.collections = collection;
  if (contentType) filter.contentType = contentType;
  if (favorite === 'true') filter.isFavorite = true;
  if (view === 'read-later') {
    filter['readLater.enabled'] = true;
    if (readLaterStatus) filter['readLater.status'] = readLaterStatus;
  }

  const result = await paginate(filter, { page: Number(page), limit: Number(limit), sort });
  res.json({ success: true, ...result });
});

// GET /api/links/trash
export const getTrash = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id, isDeleted: true };
  const result = await paginate(filter, { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 20, sort: '-deletedAt' });
  res.json({ success: true, ...result });
});

// GET /api/links/:id
export const getLinkById = asyncHandler(async (req, res) => {
  const link = await Link.findOne({ _id: req.params.id, user: req.user._id }).populate('collections', 'name color');
  if (!link) throw new ApiError(404, 'Link not found');

  const related = await Link.find({
    _id: { $in: link.manualRelatedLinks },
  }).select('title thumbnail domain');

  res.json({ success: true, data: { link, manualRelated: related } });
});

// PATCH /api/links/:id
export const updateLink = asyncHandler(async (req, res) => {
  const allowedFields = [
    'title', 'notes', 'tags', 'category', 'collections', 'difficulty',
    'technologies', 'aiSummaryShort', 'aiSummaryDetailed',
  ];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const link = await Link.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!link) throw new ApiError(404, 'Link not found');

  if (updates.tags) {
    await upsertTags(req.user._id, updates.tags);
    await recomputeEdgesForLink(req.user._id, link);
  }

  res.json({ success: true, data: { link } });
});

export const toggleFavorite = asyncHandler(async (req, res) => {
  const link = await Link.findOne({ _id: req.params.id, user: req.user._id });
  if (!link) throw new ApiError(404, 'Link not found');
  link.isFavorite = !link.isFavorite;
  await link.save();
  res.json({ success: true, data: { link } });
});

export const togglePin = asyncHandler(async (req, res) => {
  const link = await Link.findOne({ _id: req.params.id, user: req.user._id });
  if (!link) throw new ApiError(404, 'Link not found');
  link.isPinned = !link.isPinned;
  await link.save();
  res.json({ success: true, data: { link } });
});

export const toggleArchive = asyncHandler(async (req, res) => {
  const link = await Link.findOne({ _id: req.params.id, user: req.user._id });
  if (!link) throw new ApiError(404, 'Link not found');
  link.isArchived = !link.isArchived;
  await link.save();
  res.json({ success: true, data: { link } });
});

// DELETE /api/links/:id  -> soft delete (move to trash)
export const softDeleteLink = asyncHandler(async (req, res) => {
  const link = await Link.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true }
  );
  if (!link) throw new ApiError(404, 'Link not found');
  res.json({ success: true, data: { link } });
});

export const restoreLink = asyncHandler(async (req, res) => {
  const link = await Link.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { isDeleted: false, deletedAt: null } },
    { new: true }
  );
  if (!link) throw new ApiError(404, 'Link not found');
  res.json({ success: true, data: { link } });
});

// DELETE /api/links/:id/permanent
export const permanentlyDeleteLink = asyncHandler(async (req, res) => {
  const link = await Link.findOneAndDelete({ _id: req.params.id, user: req.user._id, isDeleted: true });
  if (!link) throw new ApiError(404, 'Link not found in trash');
  res.json({ success: true, message: 'Link permanently deleted' });
});

export const emptyTrash = asyncHandler(async (req, res) => {
  await Link.deleteMany({ user: req.user._id, isDeleted: true });
  res.json({ success: true, message: 'Trash emptied' });
});

// PATCH /api/links/:id/read-later
export const setReadLater = asyncHandler(async (req, res) => {
  const { enabled, reminderAt, status, preset } = req.body;
  const update = {};
  if (enabled !== undefined) update['readLater.enabled'] = enabled;
  if (status) update['readLater.status'] = status;

  if (preset === 'tomorrow') {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
    update['readLater.reminderAt'] = d;
  } else if (preset === 'weekend') {
    const d = new Date();
    const day = d.getDay();
    const diff = (6 - day + 7) % 7 || 6;
    d.setDate(d.getDate() + diff); d.setHours(9, 0, 0, 0);
    update['readLater.reminderAt'] = d;
  } else if (reminderAt) {
    update['readLater.reminderAt'] = new Date(reminderAt);
  }

  const link = await Link.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: update },
    { new: true }
  );
  if (!link) throw new ApiError(404, 'Link not found');
  res.json({ success: true, data: { link } });
});

// POST /api/links/:id/related/:targetId
export const addManualRelated = asyncHandler(async (req, res) => {
  const { id, targetId } = req.params;
  const [link, target] = await Promise.all([
    Link.findOne({ _id: id, user: req.user._id }),
    Link.findOne({ _id: targetId, user: req.user._id }),
  ]);
  if (!link || !target) throw new ApiError(404, 'Link not found');

  if (!link.manualRelatedLinks.includes(targetId)) link.manualRelatedLinks.push(targetId);
  if (!target.manualRelatedLinks.includes(id)) target.manualRelatedLinks.push(id);
  await Promise.all([link.save(), target.save()]);

  const { addManualEdge } = await import('../services/graphService.js');
  await addManualEdge(req.user._id, link._id, target._id);

  res.json({ success: true, data: { link } });
});

export default {
  saveLink, getLinks, getTrash, getLinkById, updateLink, toggleFavorite, togglePin,
  toggleArchive, softDeleteLink, restoreLink, permanentlyDeleteLink, emptyTrash,
  setReadLater, addManualRelated,
};