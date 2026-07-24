export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const units: [number, string][] = [
    [60, 'second'], [60, 'minute'], [24, 'hour'], [7, 'day'], [4.345, 'week'], [12, 'month'], [Infinity, 'year'],
  ];
  let value = seconds;
  let unit = 'second';
  for (const [amount, name] of units) {
    if (value < amount) { unit = name; break; }
    value = Math.floor(value / amount);
    unit = name;
  }
  if (value <= 1 && unit === 'second') return 'just now';
  return `${value} ${unit}${value !== 1 ? 's' : ''} ago`;
}

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  article: 'Article', blog: 'Blog', github: 'GitHub', documentation: 'Docs',
  youtube: 'YouTube', pdf: 'PDF', reddit: 'Reddit', stackoverflow: 'Stack Overflow',
  twitter: 'Twitter/X', linkedin: 'LinkedIn', medium: 'Medium', devto: 'Dev.to', other: 'Link',
};

export const CATEGORY_COLORS: Record<string, string> = {
  Programming: '#8b5cf6', Learning: '#22d3ee', Discussion: '#f472b6',
  Career: '#fbbf24', Reference: '#34d399', Reading: '#f97316', Uncategorized: '#64748b',
};

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] || '#8b5cf6';
}
