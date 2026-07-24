import Link from '../models/Link.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { normalizeUrl } from '../utils/normalizeUrl.js';
import { extractMetadata } from '../services/metadataService.js';
import { analyzeContent } from '../services/aiService.js';
import { recomputeEdgesForLink } from '../services/graphService.js';

function toCSV(links) {
  const headers = ['title', 'url', 'domain', 'category', 'tags', 'contentType', 'createdAt'];
  const rows = links.map((l) =>
    headers
      .map((h) => {
        let val = h === 'tags' ? (l.tags || []).join('|') : l[h];
        if (val instanceof Date) val = val.toISOString();
        val = String(val ?? '').replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function toMarkdown(links) {
  const lines = ['# BrainVault Export', ''];
  const byCategory = {};
  for (const l of links) {
    const cat = l.category || 'Uncategorized';
    byCategory[cat] = byCategory[cat] || [];
    byCategory[cat].push(l);
  }
  for (const [cat, items] of Object.entries(byCategory)) {
    lines.push(`## ${cat}`, '');
    for (const l of items) {
      lines.push(`- [${l.title}](${l.url}) ${l.tags?.length ? `— _${l.tags.join(', ')}_` : ''}`);
      if (l.aiSummaryShort) lines.push(`  > ${l.aiSummaryShort}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// GET /api/export?format=json|csv|markdown
export const exportLinks = asyncHandler(async (req, res) => {
  const { format = 'json' } = req.query;
  const links = await Link.find({ user: req.user._id, isDeleted: false }).lean();

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="brainvault-export.csv"');
    return res.send(toCSV(links));
  }
  if (format === 'markdown') {
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename="brainvault-export.md"');
    return res.send(toMarkdown(links));
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="brainvault-export.json"');
  res.json({ exportedAt: new Date().toISOString(), count: links.length, links });
});

// Extremely small Netscape bookmark-file (HTML) parser.
// Chrome, Firefox, and Edge all export bookmarks in this same format,
// so one parser covers "Import Chrome/Firefox/Edge Bookmarks".
function parseBookmarksHtml(html) {
  const results = [];
  const anchorRegex = /<A[^>]*HREF="([^"]+)"[^>]*>([^<]*)<\/A>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const [, href, title] = match;
    if (href.startsWith('http')) {
      results.push({ url: href, title: title.trim() || href });
    }
  }
  return results;
}

// POST /api/import/bookmarks  (multipart or raw HTML body as text)
export const importBookmarks = asyncHandler(async (req, res) => {
  const html = req.body?.html;
  if (!html) throw new ApiError(400, 'No bookmarks HTML provided. Send { "html": "<...>" } in the body.');

  const parsed = parseBookmarksHtml(html);
  if (!parsed.length) throw new ApiError(400, 'No bookmarks found in the provided file');

  const limited = parsed.slice(0, 200); // safety cap per import batch
  let imported = 0;
  let skipped = 0;

  for (const bm of limited) {
    const normalized = normalizeUrl(bm.url);
    const exists = await Link.findOne({ user: req.user._id, normalizedUrl: normalized });
    if (exists) {
      skipped += 1;
      continue;
    }
    try {
      const metadata = await extractMetadata(bm.url);
      const ai = await analyzeContent({
        title: bm.title || metadata.title,
        description: metadata.description,
        extractedText: metadata.extractedText,
        url: bm.url,
        contentType: metadata.contentType,
      });
      const link = await Link.create({
        user: req.user._id,
        url: bm.url,
        normalizedUrl: normalized,
        title: bm.title || metadata.title,
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
      });
      await recomputeEdgesForLink(req.user._id, link);
      imported += 1;
    } catch {
      skipped += 1;
    }
  }

  res.json({
    success: true,
    message: `Imported ${imported} bookmarks, skipped ${skipped} (duplicates or errors)`,
    data: { imported, skipped, totalParsed: parsed.length },
  });
});

export default { exportLinks, importBookmarks };
