import Link from '../models/Link.js';

export const findByNormalizedUrl = (userId, normalizedUrl) =>
  Link.findOne({ user: userId, normalizedUrl, isDeleted: false });

export const paginate = async (filter, { page = 1, limit = 20, sort = '-createdAt' }) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Link.find(filter).sort(sort).skip(skip).limit(limit).populate('collections', 'name color'),
    Link.countDocuments(filter),
  ]);
  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export default { findByNormalizedUrl, paginate };
