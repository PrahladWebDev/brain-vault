import mongoose from 'mongoose';

const graphEdgeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    source: { type: mongoose.Schema.Types.ObjectId, ref: 'Link', required: true },
    target: { type: mongoose.Schema.Types.ObjectId, ref: 'Link', required: true },
    weight: { type: Number, default: 1 }, // relationship strength 0-1
    reasons: [{ type: String }], // e.g. ['common-tags', 'same-domain', 'manual']
    isManual: { type: Boolean, default: false },
  },
  { timestamps: true }
);

graphEdgeSchema.index({ user: 1, source: 1, target: 1 }, { unique: true });

export default mongoose.model('GraphEdge', graphEdgeSchema);
