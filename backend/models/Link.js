import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    url: { type: String, required: true, trim: true },
    normalizedUrl: { type: String, required: true, index: true },

    title: { type: String, default: '' },
    description: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    favicon: { type: String, default: '' },
    siteName: { type: String, default: '' },
    domain: { type: String, default: '', index: true },
    contentType: {
      type: String,
      enum: [
        'article', 'blog', 'github', 'documentation', 'youtube', 'pdf',
        'reddit', 'stackoverflow', 'twitter', 'linkedin', 'medium', 'devto', 'other',
      ],
      default: 'other',
    },
    readingTimeMinutes: { type: Number, default: 0 },

    aiSummaryShort: { type: String, default: '' },
    aiSummaryDetailed: { type: String, default: '' },
    keywords: [{ type: String }],
    tags: [{ type: String, index: true }],
    category: { type: String, default: 'Uncategorized' },
    technologies: [{ type: String }],
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'unknown'], default: 'unknown' },
    relatedTopics: [{ type: String }],
    aiProvider: { type: String, enum: ['gemini', 'heuristic'], default: 'heuristic' },

    notes: { type: String, default: '' }, // markdown

    collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],

    isFavorite: { type: Boolean, default: false, index: true },
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },

    readLater: {
      enabled: { type: Boolean, default: false },
      reminderAt: { type: Date, default: null },
      status: { type: String, enum: ['unread', 'reading', 'completed', 'archived'], default: 'unread' },
    },

    linkStatus: {
      isBroken: { type: Boolean, default: false },
      lastCheckedAt: { type: Date, default: null },
      httpStatus: { type: Number, default: null },
    },

    manualRelatedLinks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Link' }],
  },
  { timestamps: true }
);

linkSchema.index({ user: 1, normalizedUrl: 1 }, { unique: true });
linkSchema.index({ title: 'text', description: 'text', notes: 'text', tags: 'text' });

export default mongoose.model('Link', linkSchema);
