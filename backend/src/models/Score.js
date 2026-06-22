import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    college: { type: String, default: '' },
    overall: { type: Number, required: true },
    reading: { type: Number, required: true },
    listening: { type: Number, required: true },
    speaking: { type: Number, required: true },
    performanceLevel: { type: String, required: true },
    report: { type: Object, required: true },
  },
  { timestamps: true }
);

export const Score = mongoose.model('Score', scoreSchema);
