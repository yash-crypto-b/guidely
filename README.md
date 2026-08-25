# Guidely — AI-Powered ATS Resume Analyzer

Get your ATS match score instantly. Our AI analyzes your resume against job descriptions, generates a custom ATS-optimized CV (LaTeX), writes personalized cover letters, and predicts interview questions — all in one flow.

## Features

- **ATS Score Analysis** — Paste a job description + upload your resume PDF to get a skills/experience/keyword/education breakdown with an overall match score
- **Custom CV Generation** — AI creates an ATS-optimized resume in LaTeX, ready for Overleaf or PDF download
- **Cover Letter Generator** — Personalized cover letter tailored to the specific job posting
- **Interview Prep** — 10 predicted interview questions with guidance based on the JD and your resume
- **Dark Mode** — Toggle between light and dark themes
- **Authentication** — Email/password sign-up and login via Supabase Auth

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite 8, Tailwind CSS 4, React Router 7 |
| **Backend** | Node.js 20+ / Express 5 (ES modules) |
| **Database & Auth** | Supabase (PostgreSQL + Auth + Storage), RLS on every table |
| **AI** | NVIDIA Nemotron via OpenAI-compatible endpoint |
| **PDF Processing** | pdf-parse, pdf2json |
| **LaTeX Compilation** | Tectonic (bundled as `tectonic.exe`) |
| **Security** | Helmet, CORS, rate limiting (global + per-AI-endpoint), input validation with Zod |

## Repo Layout

```
guidely/
├── backend/          Node.js + Express API
│   ├── src/
│   │   ├── app.js            Express app factory
│   │   ├── index.js          Server entry point
│   │   ├── config/env.js     Environment variable validation
│   │   ├── lib/ai.js         AI prompt engineering + NVIDIA calls
│   │   ├── lib/security.js   Input sanitization
│   │   ├── lib/validators.js Zod validators
│   │   ├── routes/           API route handlers
│   │   └── middleware/        Auth, error handling, rate limiting
│   ├── test/                 API tests (Node test runner)
│   ├── tectonic.exe          LaTeX compiler (Windows)
│   └── package.json
├── frontend/         React + Vite SPA
│   ├── src/
│   │   ├── components/       UI components
│   │   ├── lib/supabase.js   Supabase client
│   │   └── App.jsx           Router + auth gate
│   └── package.json
├── supabase/         SQL migrations (schema + RLS + storage)
├── docker-compose.yml
├── backend/Dockerfile
├── frontend/Dockerfile
└── README.md
```

## Prerequisites

- **Node.js** ≥ 20.11
- **npm** ≥ 10
- A **Supabase** project (free tier works)
- An **NVIDIA API key** (free tier available at build.nvidia.com)
- **Tectonic** LaTeX compiler (bundled for Windows; see below for other OS)

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/guidely.git
cd guidely
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env      # then fill in the values below
npm install
npm run dev                # starts on http://localhost:4000
```

**Backend `.env` values:**

| Variable | Description |
|----------|-------------|
| `PORT` | `4000` |
| `NODE_ENV` | `development` |
| `FRONTEND_ORIGIN` | `http://localhost:5173` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` from Supabase dashboard |
| `NVIDIA_API_KEY` | `nvapi-...` from build.nvidia.com |
| `NVIDIA_BASE_URL` | `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_MODEL` | `nvidia/nemotron-3-ultra-550b-a55b` |

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env      # then fill in the values below
npm install
npm run dev                # starts on http://localhost:5173
```

**Frontend `.env` values:**

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:4000` |
| `VITE_SUPABASE_URL` | Same Supabase project URL as backend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` from Supabase dashboard |

### 4. Supabase configuration

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL migrations from `supabase/` in the SQL Editor
3. Go to **Authentication → Providers** and ensure **Email** is enabled (disable "Confirm email" for dev)
4. Create a **Storage bucket** named `resumes` (private)
5. Copy the URL and API keys into both `.env` files

### 5. Open in browser

Visit [http://localhost:5173](http://localhost:5173) and create an account.

## Available Scripts

### Backend (`/backend`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with auto-reload (`--watch`) |
| `npm start` | Start production server |
| `npm test` | Run all tests (Node built-in test runner) |

### Frontend (`/frontend`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check |
| `POST` | `/api/analyze` | Yes | Full analysis (ATS score + breakdown + CV + cover letter + questions) |
| `POST` | `/api/cv` | Yes | Generate custom CV (LaTeX) |
| `POST` | `/api/cover-letter` | Yes | Generate cover letter |
| `GET` | `/api/stats` | No | Public usage statistics |

## Docker

### Run with Docker Compose (recommended)

```bash
docker compose up --build
```

This starts both frontend (port 5173) and backend (port 4000).

### Run individually

```bash
# Backend
cd backend
docker build -t guidely-backend .
docker run -p 4000:4000 --env-file .env guidely-backend

# Frontend
cd frontend
docker build -t guidely-frontend .
docker run -p 5173:80 guidely-frontend
```

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Connect repo on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add environment variables from `frontend/.env`
5. Deploy

### Backend → Render

1. Connect same GitHub repo on [render.com](https://render.com)
2. Set **Root Directory** to `backend`
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add all environment variables from `backend/.env`
6. Update `FRONTEND_ORIGIN` to your Vercel URL (e.g., `https://guidely.vercel.app`)

### Post-Deploy Checklist

- [ ] Update `FRONTEND_ORIGIN` in backend to the production frontend URL
- [ ] Update `VITE_API_BASE_URL` in frontend to the production backend URL
- [ ] Enable Supabase email confirmation if desired
- [ ] Set `NODE_ENV=production` on the backend
- [ ] Configure rate limits for production traffic

## Security

- **Auth**: Supabase JWT verification on all protected routes
- **RLS**: Row-Level Security enabled on every Supabase table
- **Rate Limiting**: Global (100 req/15min) + AI endpoints (20 req/hour)
- **Input Validation**: Zod schemas on all inputs
- **PDF Safety**: Parsed via memory buffer, no file persistence
- **Sanitization**: User input sanitized before AI prompts
- **Headers**: Helmet for security headers (CSP, HSTS, etc.)
- **Secrets**: All API keys server-side only, never exposed to frontend bundle

## License

Private — All rights reserved.
