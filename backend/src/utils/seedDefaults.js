import bcrypt from 'bcryptjs';
import { AssessmentContent } from '../models/AssessmentContent.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

const paragraphs = [
  {
    type: 'paragraph',
    title: 'The Power of Communication',
    text: 'Effective communication is the cornerstone of human civilization. Throughout history, the ability to express ideas clearly and persuasively has driven progress in every field. From the ancient philosophers who shaped Western thought to modern leaders who inspire millions, great communicators share common traits. They speak with clarity, listen with empathy, and adapt their message to their audience. In today\'s interconnected world, strong communication skills are more important than ever. Whether in business, education, or personal relationships, the way we express ourselves determines our success and the quality of our connections with others.',
    difficulty: 'Intermediate',
  },
  {
    type: 'paragraph',
    title: 'Climate Change and Our Future',
    text: 'Climate change represents one of the most significant challenges facing humanity in the twenty-first century. Rising global temperatures are causing unprecedented changes to weather patterns, sea levels, and ecosystems around the world. Scientists have warned that without immediate and sustained action to reduce greenhouse gas emissions, the consequences could be catastrophic. However, there is reason for optimism. Renewable energy technologies are becoming increasingly affordable and efficient. Communities around the world are adopting sustainable practices, and international cooperation on climate issues continues to grow. The transition to a green economy offers not only environmental benefits but also economic opportunities and improved quality of life.',
    difficulty: 'Advanced',
  },
];

const topics = [
  { type: 'topic', title: 'My Favorite Teacher', description: 'Talk about a teacher who influenced your life.' },
  { type: 'topic', title: 'Technology in Daily Life', description: 'Discuss how technology has changed the way we live.' },
  { type: 'topic', title: 'My Dream Job', description: 'Describe your ideal career and why it appeals to you.' },
  { type: 'topic', title: 'Climate Change', description: 'Share your thoughts on climate change and what can be done.' },
];

const listening = [
  {
    type: 'listening',
    title: 'Academic Lecture: History',
    text: 'The Industrial Revolution was a period of major industrialization and innovation that took place during the late seventeen hundreds and early eighteen hundreds. It began in Great Britain and quickly spread throughout the world. The revolution was marked by significant changes in manufacturing, transportation, and technology that had a profound effect on social, economic, and cultural conditions.',
    difficulty: 'Intermediate',
  },
  {
    type: 'listening',
    title: 'News Report: Science',
    text: 'Scientists have discovered a new species of deep sea fish in the Pacific Ocean. The fish, which lives at depths of over three thousand meters, has unique bioluminescent properties that allow it to produce its own light. Researchers believe this discovery could lead to advances in medical imaging technology.',
    difficulty: 'Beginner',
  },
];

export async function seedDefaults() {
  const contentCount = await AssessmentContent.countDocuments();
  if (contentCount === 0) {
    await AssessmentContent.insertMany([...paragraphs, ...topics, ...listening]);
  }

  // Optional admin bootstrap via environment variables.
  const adminEmail = env.adminEmail;
  const adminPassword = env.adminPassword;
  if (!adminEmail || !adminPassword) {
    return;
  }

  const adminExists = await User.findOne({ email: adminEmail });
  if (!adminExists) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await User.create({
      name: env.adminName,
      email: adminEmail,
      passwordHash: hash,
      role: 'admin',
      college: 'VoiceIQ HQ',
      avatar: 'A',
      streak: 0,
    });
  }
}
