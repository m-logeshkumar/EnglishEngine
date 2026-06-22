import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is missing. Set it in backend/.env');
  }

  await mongoose.connect(env.mongoUri);
  console.log('MongoDB connected');
}
