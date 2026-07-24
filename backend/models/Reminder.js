import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    link: { type: mongoose.Schema.Types.ObjectId, ref: 'Link', required: true, index: true },
    remindAt: { type: Date, required: true },
    label: { type: String, default: '' }, // e.g. "Tomorrow", "Weekend", "Custom"
    isDismissed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Reminder', reminderSchema);
