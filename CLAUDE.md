# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend (React + Vite)
cd frontend && npm run dev      # Start dev server (port 5173)
cd frontend && npm run build    # Build production bundle to frontend/dist/
cd frontend && npm run lint     # ESLint check

# Backend (FastAPI)
cd backend && pip install -r requirements.txt  # Install Python deps
cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Image preprocessing (offline)
cd backend && python generate_photos.py
```

## Project Architecture

A personal portfolio site: React frontend + FastAPI backend, serving Markdown blogs and WebP photo albums.

### Frontend (React 19 + Vite + Tailwind CSS)

- **Routing**: React Router with pages: `/` (blog list), `/photos` (gallery), `/blog?md=url` (blog post), `/login` (admin), `/admin` (image management)
- **Styling**: Tailwind CSS with dark theme (bg-neutral-950 + purple/blue accent palette), shadcn/ui components (Dialog, NavigationMenu)
- **Markdown rendering**: `react-markdown` with remark-gfm, remark-math, rehype-highlight, rehype-katex for GitHub-flavored markdown, code highlighting, and LaTeX
- **Photo gallery**: CSS columns-based masonry layout with zoom preview via Dialog
- **Auth**: JWT token stored in localStorage, sent as Bearer header
- **Vite proxy**: Dev server proxies `/api`, `/Media`, `/Blogs` to `http://localhost:8000`

### Backend (Python FastAPI)

- **API endpoints**:
  - `GET /api/Blogs` — list blog folders and their `.md` files
  - `GET /api/Media` — list photo folders with thumb/full WebP URLs (newest first)
  - `POST /api/login` — authenticate, returns JWT (12h expiry)
  - `POST /api/upload` — upload image (auth required), auto-converts to 800.webp + 2400.webp
  - `DELETE /api/delete?folder=xxx` — delete photo folder (auth required)
  - `GET /api/me` — verify token validity
- **Image processing**: Pillow resizes longest edge to 800/2400px, converts to WebP, preserves EXIF orientation
- **Auth**: JWT via `python-jose`, hardcoded credentials in `auth.py` (change before deploy)
- **Static mounts**: `/Media` serves the Media directory, `/Blogs` serves the Blogs directory

### Data directories (gitignored)

- `Blogs/` — Markdown blog posts, one folder per post
- `Media/` — WebP photos, one folder per image (containing `800.webp` and `2400.webp`)
- `photos/` — local source images for offline preprocessing

### Deployment

- Nginx serves `frontend/dist/` with SPA fallback (`try_files $uri /index.html`)
- API reverse-proxied via `location /api/` with 50MB upload limit
- Static asset caching: 1d expiry for versioned files
