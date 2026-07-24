import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/brainvault';
    await mongoose.connect(uri);
    console.log(`[BrainVault] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('[BrainVault] MongoDB connection error:', err.message);
    process.exit(1);
  }
};

export default connectDB;
