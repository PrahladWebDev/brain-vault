import User from '../models/User.js';
import Collection from '../models/Collection.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { generateToken } from '../utils/generateToken.js';

const DEFAULT_COLLECTIONS = ['Programming', 'React', 'Node', 'AI', 'DevOps', 'Career', 'Interview', 'Personal'];

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password });

  await Collection.insertMany(
    DEFAULT_COLLECTIONS.map((name) => ({ user: user._id, name, isDefault: true }))
  ).catch(() => {}); // non-fatal if it fails

  const token = generateToken(user._id);
  res.status(201).json({ success: true, data: { user: user.toSafeObject(), token } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  const token = generateToken(user._id);
  res.json({ success: true, data: { user: user.toSafeObject(), token } });
});

export const logout = asyncHandler(async (req, res) => {
  // Stateless JWT: logout is handled client-side by discarding the token.
  // Endpoint kept for symmetry / future token-blacklisting.
  res.json({ success: true, message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeObject() } });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const allowed = ['theme', 'accentColor', 'fontSize', 'graphPhysics'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[`settings.${key}`] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
  res.json({ success: true, data: { user: user.toSafeObject() } });
});

export default { register, login, logout, getMe, updateSettings };
