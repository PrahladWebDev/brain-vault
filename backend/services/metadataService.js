import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

const CONTENT_TYPE_RULES = [
  { test: (d) => /(^|\.)youtube\.com$/.test(d) || d === 'youtu.be', type: 'youtube' },
  { test: (d) => d === 'github.com' || /(^|\.)github\.com$/.test(d), type: 'github' },
  { test: (d) => /(^|\.)stackoverflow\.com$/.test(d), type: 'stackoverflow' },
  { test: (d) => d === 'reddit.com' || /(^|\.)reddit\.com$/.test(d), type: 'reddit' },
  { test: (d) => d === 'x.com' || /(^|\.)twitter\.com$/.test(d) || /(^|\.)x\.com$/.test(d), type: 'twitter' },
  { test: (d) => /(^|\.)linkedin\.com$/.test(d), type: 'linkedin' },
  { test: (d) => /(^|\.)medium\.com$/.test(d), type: 'medium' },
  { test: (d) => /(^|\.)dev\.to$/.test(d), type: 'devto' },
  { test: (d) => /docs\.|documentation|readthedocs|\/docs\b/.test(d), type: 'documentation' },
];

const WORDS_PER_MINUTE = 220;

function detectContentType(domain, url) {
  for (const rule of CONTENT_TYPE_RULES) {
    if (rule.test(domain)) return rule.type;
  }
  if (/\.pdf($|\?)/i.test(url)) return 'pdf';
  if (/blog/i.test(domain)) return 'blog';
  return 'article';
}

function estimateReadingTime(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function absoluteUrl(base, maybeRelative) {
  if (!maybeRelative) return '';
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return '';
  }
}

/**
 * Fetches a URL and extracts OpenGraph / meta metadata.
 * Falls back gracefully to whatever can be inferred from the URL itself
 * if the page cannot be fetched (private pages, blocked bots, timeouts, etc.)
 */
export async function extractMetadata(rawUrl) {
  const url = new URL(rawUrl);
  const domain = url.hostname.replace(/^www\./, '');
  const contentType = detectContentType(domain, rawUrl);

  const base = {
    url: rawUrl,
    title: url.pathname.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') || domain,
    description: '',
    thumbnail: '',
    favicon: `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
    siteName: domain,
    domain,
    contentType,
    readingTimeMinutes: 1,
    extractedText: '',
  };

  if (contentType === 'pdf') {
    return { ...base, title: base.title || 'PDF Document' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(rawUrl, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; BrainVaultBot/1.0; +https://brainvault.app/bot)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { ...base, linkStatusCode: response.status };
    }

    const contentTypeHeader = response.headers.get('content-type') || '';
    if (!contentTypeHeader.includes('text/html')) {
      return { ...base, linkStatusCode: response.status };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const metaContent = (selector) => $(selector).attr('content')?.trim();

    const title =
      metaContent('meta[property="og:title"]') ||
      metaContent('meta[name="twitter:title"]') ||
      $('title').first().text().trim() ||
      base.title;

    const description =
      metaContent('meta[property="og:description"]') ||
      metaContent('meta[name="twitter:description"]') ||
      metaContent('meta[name="description"]') ||
      '';

    const thumbnailRaw =
      metaContent('meta[property="og:image"]') ||
      metaContent('meta[name="twitter:image"]') ||
      '';
    const thumbnail = absoluteUrl(rawUrl, thumbnailRaw);

    const faviconRaw =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      '';
    const favicon = faviconRaw ? absoluteUrl(rawUrl, faviconRaw) : base.favicon;

    const siteName = metaContent('meta[property="og:site_name"]') || domain;

    // Pull visible body text for reading-time + AI summarization input
    $('script, style, noscript, nav, footer, header, svg').remove();
    const bodyText = $('article').text() || $('main').text() || $('body').text() || '';
    const cleanedText = bodyText.replace(/\s+/g, ' ').trim().slice(0, 12000);

    return {
      ...base,
      title: title || base.title,
      description: description || '',
      thumbnail,
      favicon,
      siteName,
      readingTimeMinutes: estimateReadingTime(cleanedText),
      extractedText: cleanedText,
    };
  } catch (err) {
    // Network failure, timeout, bot-blocked, etc. Return best-effort base metadata.
    return { ...base, fetchError: err.message };
  }
}

export default extractMetadata;
