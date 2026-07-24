import Collection from '../models/Collection.js';
import Link from '../models/Link.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const createCollection = asyncHandler(async (req, res) => {
  const { name, color, icon, parent } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, 'Collection name is required');

  const collection = await Collection.create({
    user: req.user._id,
    name: name.trim(),
    color: color || '#8b5cf6',
    icon: icon || 'folder',
    parent: parent || null,
  });
  res.status(201).json({ success: true, data: { collection } });
});

export const getCollections = asyncHandler(async (req, res) => {
  const collections = await Collection.find({ user: req.user._id }).sort('name');

  const counts = await Link.aggregate([
    { $match: { user: req.user._id, isDeleted: false } },
    { $unwind: '$collections' },
    { $group: { _id: '$collections', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

  const withCounts = collections.map((c) => ({
    ...c.toObject(),
    linkCount: countMap[c._id.toString()] || 0,
  }));

  // Build a simple nested tree
  const byId = Object.fromEntries(withCounts.map((c) => [c._id.toString(), { ...c, children: [] }]));
  const roots = [];
  for (const c of Object.values(byId)) {
    if (c.parent) {
      const parentId = c.parent.toString();
      if (byId[parentId]) byId[parentId].children.push(c);
      else roots.push(c);
    } else {
      roots.push(c);
    }
  }

  res.json({ success: true, data: { collections: withCounts, tree: roots } });
});

export const updateCollection = asyncHandler(async (req, res) => {
  const { name, color, icon, parent } = req.body;
  const collection = await Collection.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { ...(name && { name }), ...(color && { color }), ...(icon && { icon }), parent: parent ?? undefined } },
    { new: true, runValidators: true }
  );
  if (!collection) throw new ApiError(404, 'Collection not found');
  res.json({ success: true, data: { collection } });
});

export const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!collection) throw new ApiError(404, 'Collection not found');

  await Link.updateMany({ user: req.user._id }, { $pull: { collections: collection._id } });
  await Collection.updateMany({ user: req.user._id, parent: collection._id }, { $set: { parent: null } });

  res.json({ success: true, message: 'Collection deleted' });
});

export default { createCollection, getCollections, updateCollection, deleteCollection };
