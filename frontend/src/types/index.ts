export interface User {
  _id: string;
  name: string;
  email: string;
  avatarColor: string;
  settings: {
    theme: string;
    accentColor: string;
    fontSize: string;
    graphPhysics: { gravity: number; linkDistance: number; charge: number };
  };
  stats: { readingStreak: number; lastReadDate: string | null };
}

export type ContentType =
  | 'article' | 'blog' | 'github' | 'documentation' | 'youtube' | 'pdf'
  | 'reddit' | 'stackoverflow' | 'twitter' | 'linkedin' | 'medium' | 'devto' | 'other';

export interface Collection {
  _id: string;
  name: string;
  color: string;
  icon: string;
  parent: string | null;
  isDefault?: boolean;
  linkCount?: number;
  children?: Collection[];
}

export interface Link {
  _id: string;
  url: string;
  title: string;
  description: string;
  thumbnail: string;
  favicon: string;
  siteName: string;
  domain: string;
  contentType: ContentType;
  readingTimeMinutes: number;
  aiSummaryShort: string;
  aiSummaryDetailed: string;
  keywords: string[];
  tags: string[];
  category: string;
  technologies: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'unknown';
  relatedTopics: string[];
  aiProvider: 'gemini' | 'heuristic';
  notes: string;
  collections: Collection[] | string[];
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  readLater: { enabled: boolean; reminderAt: string | null; status: 'unread' | 'reading' | 'completed' | 'archived' };
  linkStatus: { isBroken: boolean; lastCheckedAt: string | null; httpStatus: number | null };
  manualRelatedLinks: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GraphNode {
  id: string;
  label: string;
  domain: string;
  category: string;
  tags: string[];
  contentType: ContentType;
  isFavorite: boolean;
  thumbnail?: string;
  favicon?: string;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  weight: number;
  reasons: string[];
  isManual: boolean;
}

export interface DashboardData {
  totals: {
    totalLinks: number;
    favorites: number;
    archived: number;
    brokenLinks: number;
    collections: number;
    totalReadingMinutes: number;
  };
  recentlyAdded: Link[];
  domains: { domain: string; count: number }[];
  categories: { category: string; count: number }[];
  weeklyActivity: { date: string; count: number }[];
  readingProgress: Record<string, number>;
  readingStreak: number;
  knowledgeGrowth: { week: number; newLinks: number; total: number }[];
}
