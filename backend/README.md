# VoiceIQ Backend (MongoDB + Gemini)

## Local Setup

1. Install dependencies:
   npm install

2. Create env file:
   copy .env.example .env

3. Update env values:
   - MONGODB_URI (MongoDB Atlas or local Mongo URL)
   - JWT_SECRET
   - GEMINI_API_KEY
   - CLIENT_ORIGIN (frontend URL)

4. Start server:
   npm run dev

Health check: GET /api/health
