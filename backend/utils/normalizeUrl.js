export const normalizeUrl = (rawUrl) => {
  try {
    const u = new URL(rawUrl);
    u.hash = '';
    const stripParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref', 'igshid'];
    stripParams.forEach((p) => u.searchParams.delete(p));
    let normalized = `${u.protocol}//${u.host}${u.pathname}${u.search}`;
    if (normalized.endsWith('/') && u.pathname !== '/') normalized = normalized.slice(0, -1);
    return normalized.toLowerCase();
  } catch {
    return rawUrl.trim().toLowerCase();
  }
};

export default normalizeUrl;
