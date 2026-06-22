import mongoose from 'mongoose';

const assessmentContentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['paragraph', 'topic', 'listening'], required: true },
    title: { type: String, required: true, trim: true },
    text: { type: String, default: '' },
    description: { type: String, default: '' },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  },
  { timestamps: true }
);

export const AssessmentContent = mongoose.model('AssessmentContent', assessmentContentSchema);
