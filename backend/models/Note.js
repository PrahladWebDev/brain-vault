import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    link: { type: mongoose.Schema.Types.ObjectId, ref: 'Link', required: true, index: true },
    content: { type: String, default: '' }, // markdown
  },
  { timestamps: true }
);

export default mongoose.model('Note', noteSchema);
