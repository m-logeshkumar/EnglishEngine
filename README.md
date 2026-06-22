# VoiceIQ AI (Frontend + Backend)

This project now uses:

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB (via Mongoose)
- AI Evaluation: Gemini API

## Project Structure

frontend (root):

- src/components
- src/pages
- src/contexts
- src/services

backend:

- backend/src/config
- backend/src/controllers
- backend/src/models
- backend/src/routes
- backend/src/services
- backend/src/middleware
- backend/src/utils

## Local Development

1. Frontend setup (from project root)

```bash
npm install
copy .env.example .env
```

Set in `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start frontend:

```bash
npm run dev
```

2. Backend setup (from `backend` folder)

```bash
npm install
copy .env.example .env
```

Set in `backend/.env`:

```env
PORT=5000
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-strong-secret
GEMINI_API_KEY=your-gemini-key
CLIENT_ORIGIN=http://localhost:5173
```

Start backend:

```bash
npm run dev
```

Backend health endpoint:

`GET /api/health`

## Render Hosting Procedure

This repo includes `render.yaml` for easier setup.

### 1. Prepare MongoDB

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Add Render outbound IP allowlist or temporarily allow all (`0.0.0.0/0`) for testing.
4. Copy connection string into `MONGODB_URI`.

### 2. Deploy Backend on Render

1. Create a new Web Service from this repo.
2. Set root directory to `backend`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables:
	- `MONGODB_URI`
	- `JWT_SECRET`
	- `GEMINI_API_KEY`
	- `CLIENT_ORIGIN` (set this to frontend URL after frontend is deployed)
6. Deploy and copy backend URL, e.g. `https://voiceiq-backend.onrender.com`.

### 3. Deploy Frontend on Render

1. Create a Static Site from this repo.
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`
4. Add env variable:
	- `VITE_API_BASE_URL=https://voiceiq-backend.onrender.com/api`
5. Deploy frontend.

### 4. Final CORS Update

Update backend `CLIENT_ORIGIN` to the final frontend Render URL and redeploy backend.

## Notes

- If `GEMINI_API_KEY` is missing, backend returns fallback analysis payloads.
