import Link from '../models/Link.js';
import GraphEdge from '../models/GraphEdge.js';

function jaccard(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Recomputes graph edges for a single new/updated link against all of the
 * user's other (non-deleted) links, based on:
 *  - shared tags (Jaccard similarity)
 *  - shared technologies
 *  - same domain
 *  - simple keyword-overlap "AI similarity" proxy
 * Manual links (user-created) are preserved and always kept at weight 1.
 */
export async function recomputeEdgesForLink(userId, link) {
  const others = await Link.find({
    user: userId,
    _id: { $ne: link._id },
    isDeleted: false,
  }).select('_id tags technologies domain keywords category');

  const linkTags = new Set((link.tags || []).map((t) => t.toLowerCase()));
  const linkTech = new Set((link.technologies || []).map((t) => t.toLowerCase()));
  const linkKeywords = new Set((link.keywords || []).map((t) => t.toLowerCase()));

  const bulkOps = [];

  for (const other of others) {
    const otherTags = new Set((other.tags || []).map((t) => t.toLowerCase()));
    const otherTech = new Set((other.technologies || []).map((t) => t.toLowerCase()));
    const otherKeywords = new Set((other.keywords || []).map((t) => t.toLowerCase()));

    const tagSim = jaccard(linkTags, otherTags);
    const techSim = jaccard(linkTech, otherTech);
    const keywordSim = jaccard(linkKeywords, otherKeywords);
    const sameDomain = link.domain && link.domain === other.domain ? 1 : 0;
    const sameCategory = link.category && link.category === other.category ? 1 : 0;

    const reasons = [];
    if (tagSim > 0) reasons.push('common-tags');
    if (techSim > 0) reasons.push('same-technologies');
    if (sameDomain) reasons.push('same-domain');
    if (keywordSim > 0.15) reasons.push('ai-similarity');
    if (sameCategory) reasons.push('same-category');

    // Weighted combination -> relationship strength 0..1
    const weight =
      tagSim * 0.4 + techSim * 0.25 + keywordSim * 0.2 + sameDomain * 0.1 + sameCategory * 0.05;

    if (weight >= 0.12) {
      bulkOps.push({
        updateOne: {
          filter: { user: userId, source: link._id, target: other._id },
          update: {
            $set: {
              user: userId,
              source: link._id,
              target: other._id,
              weight: Math.min(1, Number(weight.toFixed(3))),
              reasons,
              isManual: false,
            },
          },
          upsert: true,
        },
      });
    } else {
      // remove stale weak auto-generated edge if it exists
      bulkOps.push({
        deleteOne: {
          filter: { user: userId, source: link._id, target: other._id, isManual: false },
        },
      });
    }
  }

  if (bulkOps.length) {
    await GraphEdge.bulkWrite(bulkOps, { ordered: false }).catch(() => {});
  }
}

export async function addManualEdge(userId, sourceId, targetId) {
  return GraphEdge.findOneAndUpdate(
    { user: userId, source: sourceId, target: targetId },
    { $set: { weight: 1, isManual: true, reasons: ['manual'] } },
    { upsert: true, new: true }
  );
}

export async function removeEdge(userId, sourceId, targetId) {
  await GraphEdge.deleteMany({
    user: userId,
    $or: [
      { source: sourceId, target: targetId },
      { source: targetId, target: sourceId },
    ],
  });
}

export async function getGraphForUser(userId, { category, search } = {}) {
  const linkQuery = { user: userId, isDeleted: false, isArchived: false };
  if (category) linkQuery.category = category;
  if (search) linkQuery.title = { $regex: search, $options: 'i' };

  const links = await Link.find(linkQuery).select(
    'title domain category tags contentType isFavorite thumbnail favicon'
  );
  const linkIds = links.map((l) => l._id);

  const edges = await GraphEdge.find({
    user: userId,
    source: { $in: linkIds },
    target: { $in: linkIds },
  }).select('source target weight reasons isManual');

  const nodes = links.map((l) => ({
    id: l._id.toString(),
    label: l.title,
    domain: l.domain,
    category: l.category,
    tags: l.tags,
    contentType: l.contentType,
    isFavorite: l.isFavorite,
    thumbnail: l.thumbnail,
    favicon: l.favicon,
  }));

  const edgeList = edges.map((e) => ({
    id: e._id.toString(),
    source: e.source.toString(),
    target: e.target.toString(),
    weight: e.weight,
    reasons: e.reasons,
    isManual: e.isManual,
  }));

  return { nodes, edges: edgeList };
}

export default { recomputeEdgesForLink, addManualEdge, removeEdge, getGraphForUser };
