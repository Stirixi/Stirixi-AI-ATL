# Stirixi AI ATL

Stirixi AI ATL is a Next.js 16 dashboard that surfaces engineering efficiency signals across teams, projects, and prospective hires. It ships with an integration-focused landing page, a tabbed performance dashboard, drill-down views for individual engineers/projects, and AI usage insights to help leaders understand how work is progressing.

## Features

- **Integrations onboarding** – mock connectors for GitHub, IDE agents, and ticketing tools to illustrate the setup experience.
- **Executive dashboard** – tabbed view for team-level metrics, project health, and prospective hires, backed by reusable cards in `components/`.
- **Engineer + project drill-downs** – dynamic routes (`app/engineers/[id]`, `app/projects/[id]`, `app/prospective/[id]`) pair profile cards, KPI grids, timelines, and team rosters.
- **AI usage visibility** – `EngineerMetrics` exposes AI spend alongside prompt history using collapsible panels.
- **Componentized UI system** – built with Radix UI primitives, shadcn-inspired components (`components/ui`), Tailwind CSS 4 tokens, Lucide icons, and Recharts visualizations.

## Tech Stack

- Next.js 16 (App Router, React Server Components)
- React 19 + TypeScript
- Tailwind CSS 4, PostCSS, shadcn-style component library
- Radix UI, Lucide Icons, Recharts, Embla Carousel, Sonner toasts
- pnpm + ESLint

## Getting Started

### Prerequisites

- Node.js 18.17+ (Next.js 16 recommends Node 18+; use 20 LTS if available)
- [pnpm](https://pnpm.io/) (project ships with `pnpm-lock.yaml`)

### Installation

```bash
pnpm install
```

### Development server

```bash
pnpm dev
```

This starts `next dev` on `http://localhost:3000`. The root path (`/`) shows the integrations onboarding, and `/dashboard` surfaces the full metrics workspace.

### Additional scripts

| Command      | Description                       |
| ------------ | --------------------------------- |
| `pnpm build` | Production build (`next build`).  |
| `pnpm start` | Run the production server.        |
| `pnpm lint`  | ESLint over the entire workspace. |

## Project Structure

```
app/                # App Router pages, layouts, and route groups
├── dashboard/      # Executive dashboard
├── engineers/[id]  # Engineer drill-down
├── projects/[id]   # Project drill-down
├── prospective/[id]# Prospective hire detail
└── page.tsx        # Integrations onboarding landing page
components/         # Reusable UI primitives and domain widgets
public/             # Static assets
styles/             # Tailwind entry points
components.json     # shadcn component manifest
```

## Mock Data & Extensibility

Most cards currently use in-component mock datasets (see `components/team-metrics.tsx`, `components/projects-list.tsx`, `components/engineer-metrics.tsx`, etc.). Replace these arrays/objects with live data-fetching calls (REST, GraphQL, or Data Fetching Functions) and promote the data contracts into shared types under `lib/` as you productionize.

The design system follows shadcn conventions: update tokens in `styles` and `app/globals.css`, or run `pnpm dlx shadcn@latest add <component>` to extend the UI kit.

## Deployment

1. Build: `pnpm build`
2. Serve: `pnpm start` (uses the compiled `.next` output)
3. Configure environment variables via `.env.local` (none are required for the mock data, but Next.js will auto-load them during `next build`/`next start`).

Deploying to Vercel/Netlify works out-of-the-box because no server-side secrets are required yet. Add your actual integration keys through environment variables before shipping to production.

### Automated Vultur deployment

The repo now ships with Dockerfiles for both the FastAPI backend (`backend/Dockerfile`) and the Next.js frontend (`frontend.Dockerfile`), a production compose stack (`deploy/docker-compose.prod.yml`), and a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds/pushes GHCR images and redeploys the Vultur VM whenever `main` receives a new commit.

1. **GitHub Secrets** – add the following under *Settings → Secrets and variables → Actions*:
   - `VULTUR_HOST`, `VULTUR_USER`, `VULTUR_PASSWORD` – SSH credentials for `104.156.255.210`.
   - `GHCR_DEPLOY_USERNAME`, `GHCR_DEPLOY_TOKEN` – a PAT (read:packages) so the server can pull from GHCR.
   - `MONGODB_URL`, `MONGODB_DB_NAME` – point to Atlas or accept the default `mongodb://mongo:27017` + `stirixi_ai_atl`.
   - `NEXT_PUBLIC_API_URL` – e.g. `http://104.156.255.210:8000/api/v1`; baked into the frontend image at build time.
   - `CORS_ORIGINS` – comma-separated origin list for the backend (include your production URL).
2. **Repository variables (optional)** – set `DEPLOY_PATH` if you prefer a path other than `/opt/stirixi-ai-atl` on the server.
3. **Firewall/ports** – ensure ports `80` (frontend) and `8000` (backend API) are open on the Vultur instance.
4. **Mongo persistence** – the compose file mounts a `mongo_data` volume in Docker; Atlas users can comment out the `mongo` service and update `MONGODB_URL` accordingly.

Once configured, every push to `main` will:

- Build/push `ghcr.io/<owner>/<repo>-backend` and `...-frontend` images (tagged with the commit SHA and `latest`).
- Copy the `deploy` bundle to the server, install Docker/Compose if missing, refresh the `.env` file, log in to GHCR, pull the latest images, and run `docker compose up -d --remove-orphans` so the backend, frontend, and MongoDB stay in sync.
