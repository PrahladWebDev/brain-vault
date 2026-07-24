import { getGraphForUser, addManualEdge, removeEdge } from '../services/graphService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getGraph = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const graph = await getGraphForUser(req.user._id, { category, search });
  res.json({ success: true, data: graph });
});

export const createEdge = asyncHandler(async (req, res) => {
  const { source, target } = req.body;
  const edge = await addManualEdge(req.user._id, source, target);
  res.status(201).json({ success: true, data: { edge } });
});

export const deleteEdge = asyncHandler(async (req, res) => {
  const { source, target } = req.body;
  await removeEdge(req.user._id, source, target);
  res.json({ success: true, message: 'Edge removed' });
});

export default { getGraph, createEdge, deleteEdge };
