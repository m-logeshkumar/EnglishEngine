import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { seedDefaults } from './utils/seedDefaults.js';

async function start() {
  await connectDB();
  await seedDefaults();

  app.listen(env.port, () => {
    console.log(`Backend running on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start backend:', err);
  process.exit(1);
});
