import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#8b5cf6' },
    icon: { type: String, default: 'folder' },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', default: null },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

collectionSchema.index({ user: 1, name: 1, parent: 1 }, { unique: true });

export default mongoose.model('Collection', collectionSchema);
