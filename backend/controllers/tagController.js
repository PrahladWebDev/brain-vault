import Tag from '../models/Tag.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getTags = asyncHandler(async (req, res) => {
  const tags = await Tag.find({ user: req.user._id }).sort('-usageCount').limit(200);
  res.json({ success: true, data: { tags } });
});

export default { getTags };
