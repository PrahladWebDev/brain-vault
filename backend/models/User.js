import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    avatarColor: { type: String, default: '#7c3aed' },
    settings: {
      theme: { type: String, default: 'dark' },
      accentColor: { type: String, default: '#8b5cf6' },
      fontSize: { type: String, default: 'md' },
      graphPhysics: {
        gravity: { type: Number, default: -30 },
        linkDistance: { type: Number, default: 90 },
        charge: { type: Number, default: -120 },
      },
    },
    stats: {
      readingStreak: { type: Number, default: 0 },
      lastReadDate: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
