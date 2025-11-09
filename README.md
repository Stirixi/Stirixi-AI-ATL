# Stirixi AI ATL

Enterprise engineering leaders are drowning in siloed metrics. Stirixi AI ATL is our MLH hackathon submission that unifies engineer delivery data, hiring pipelines, AI usage, OLAP analytics, and on-chain proof of work into one full-stack observability platform. The project ships with a production-grade Next.js interface, a FastAPI + Mongo backend, deterministic fake data, Solana SBT minting services, Snowflake OLAP warehouses fed by ETL jobs (GitHub + Linear + Codex + Cursor + Claude), and a Gemini-powered CTO copilot (“StirixiAI”) that is embedded everywhere as a minimizable widget.

---

## ⚡️ TL;DR for MLH Judges

- **Live engineering cockpit** – Next.js 16 dashboard with team overviews, drill-down pages for engineers, projects, and prospects, plus integrations onboarding.
- **StirixiAI copilot** – Gemini-backed assistant that reads the org snapshot, auto-summarizes risk, and recommends staffing moves right from a floating widget.
- **Snowflake OLAP backbone** – batch ETL pulls structured signals from GitHub, Linear, Codex, Cursor, and Claude transcripts into Snowflake where feature engineering + ML scoring jobs run.
- **On-chain credibility** – FastAPI service mints Token-2022 SBTs on Solana Devnet, hashes score payloads, and surfaces wallets/signatures in the UI with mock fallbacks.
- **Full data stack** – MongoDB stores engineers/projects/prompts/prospects and score history; backend exposes CRUD + scoring endpoints; deterministic seed scripts keep demo data in sync.
- **DevOps ready** – Dockerized backend/frontend, GH Actions workflow, and production `docker-compose` for one-click deployment to a Vultur VM.

---

## Problem & Solution

| Problem for CTOs | How Stirixi Solves It |
| ---------------- | --------------------- |
| Engineering efficiency data sits across GitHub, ticketing, and ad‑hoc spreadsheets. | A single React dashboard aggregates PR throughput, bug rates, review latency, AI spend, and hiring funnels. |
| No shared truth when presenting to boards/investors. | StirixiAI converts metrics into plain-language narratives with action plans and links back to live tiles. |
| Difficult to prove talent credentials beyond résumés. | Solana SBT snapshots capture performance hashes + signatures, proving contributions across employers. |
| Demo environments are brittle. | Deterministic fake data, mock SBT generators, and Gemini fallback prompts guarantee a smooth hackathon walkthrough. |

---

## Product Walkthrough

1. **Integrations Landing (`/`)**  
   Onboarding cards highlight GitHub, IDE agents, and ticketing connectors with progress states to show “Day 0” setup.

2. **Executive Dashboard (`/dashboard`)**  
   Tabbed layout (Team / Projects / Prospective Hires) showcases KPIs, PR throughput trend lines, resource allocation, and candidate fit lists. Everything is server-rendered and hydrated with live API data.

3. **Engineer Drill-down (`/engineers/[id]`)**  
   - Profile card with skills, Github handle, and AI spend.  
   - `EngineerMetrics` visualizes PRs, estimation accuracy, bug generation, review times, and AI spend vs company averages.  
   - `EngineerActivity` timeline lists actions across projects.  
   - `EngineerSBTPanel` displays on-chain score snapshots, wallet, Solana signature, recommendations, and historical changes.

4. **Project + Prospect Detail Pages**  
   `ProjectTeam` and prospect views reuse the same components to show cross-functional rosters and “good fit” candidates.

5. **StirixiAI Widget (global)**  
   - Floating button opens a chat window with suggestion chips, streaming transcript, and an “Org snapshot” card that pulls live stats.  
   - Messages are persisted in state; POST requests hit `/api/stirixi-ai`, which composes a context prompt (“Org Snapshot,” top engineers, project coverage, candidate bench) and calls Gemini.  
   - Judges can minimize the assistant and it follows them across pages without reloading.

6. **Backend & SBT Flow**  
   - FastAPI exposes `/api/v1/engineers`, `/projects`, `/prospects`, `/prompts`, `/actions`, and `/engineers/{id}/scores`.  
   - `SolanaSBTService` constructs a JSON payload, hashes it, calls the Token-2022 mint, and stores signatures plus score hashes in Mongo.  
   - When the backend lacks real mints, `lib/mock-sbt.ts` generates deterministic base58 wallets, signatures, and score histories so the UI always demonstrates the feature.

---

## Architecture Overview

```
┌────────────────────┐        ┌────────────────────────┐        ┌────────────────────────────┐
│  Next.js 16 (RSC)  │        │ FastAPI (backend/app)  │        │ Snowflake OLAP Warehouse   │
│  - App Router      │   API  │ - MongoDB driver       │  ETL   │ (GitHub/Linear/Codex/      │
│  - Tailwind 4      │ <────► │ - SBT mint service     │ <───►  │  Cursor/Claude pipelines)  │
│  - shadcn UI       │        │ - REST endpoints       │        │  + ML scoring jobs         │
└────────┬───────────┘        └────────┬──────────────┘        └───────────┬────────────────┘
         │                               │                                   │
         │ SSR + fetch                    │ Motor (AsyncIO)                   │ Feature exports
         ▼                               ▼                                   ▼
┌────────────────────┐        ┌────────────────────────┐        ┌────────────────────────┐
│  StirixiAI widget  │        │ MongoDB (operational   │        │ Solana Token-2022 SBT  │
│  - Gemini API via  │        │ store: engineers,      │        │ mint + hashes          │
│    /api/stirixi-ai │        │ projects, prompts,     │        └────────────────────────┘
└────────────────────┘        │ prospects, actions)    │
                              └────────────────────────┘
```

### Frontend
- Next.js 16 App Router, React 19, TypeScript.
- Component library: Radix primitives + shadcn-inspired wrappers under `components/ui`.
- Charts: Recharts for KPIs, Lucide icons for context.
- Styling: Tailwind CSS 4 tokens, PostCSS.
- State: Server Components for data fetching, client components for interactivity (`'use client'`).

### Backend
- FastAPI app under `backend/app`.
- MongoDB via `motor` AsyncIO client with indexes created at startup.
- Snowflake OLAP warehouse receives batched ETL jobs ingesting GitHub events, Linear issues, Codex/Cursor coding telemetry, and Claude AI session metadata; ML notebooks run there to compute reliability/AI efficiency/bug propensity scores which are exported back to Mongo for the UI and SBT payloads.
- Pydantic v2 models for engineers, projects, prompts, prospects, actions, and engineer scores.
- Services layer includes Solana SBT minting with deterministic schema hashing and payload validation.

### AI / ML
- `lib/mock-sbt.ts` produces deterministic score trajectories (overall, reliability, AI efficiency, bug rate, confidence) so we can show improvements/regressions.
- `app/api/stirixi-ai/route.ts` aggregates org data (engineers, projects, prospects), creates a context block, and calls Gemini (`gemini-1.5-flash` by default) using Google’s Generative Language API.
- Temperature is tuned to 0.35 to keep responses executive-friendly with minimal hallucinations.
- Snowflake ETL: scheduled dbt-like jobs pull GitHub PR metadata, Linear issue state, Codex/Cursor coding stats, and Claude prompt analytics into Snowflake; feature engineering plus ML regression/classifiers produce the overall/reliability/AI-efficiency/bug-rate scores consumed by both Mongo and Solana SBT mints.

### DevOps
- Dockerfiles for frontend (`frontend.Dockerfile`) and backend.
- `deploy/docker-compose.prod.yml` orchestrates Nginx-style frontend + FastAPI + Mongo.
- GitHub Actions workflow builds/pushes GHCR images, SSHes into the Vultur VM, pulls images, and restarts services.

---

## Technical Highlights

1. **Deterministic SBT Engine**  
   `lib/mock-sbt.ts` ensures the UI always has base58 wallet addresses, score hashes, and Solana signatures even without a live chain. Judges can still inspect “Wallet”, “Signature”, “Score hash” fields, and see growth deltas over time.

2. **Gemini Contextual Prompting**  
   `/api/stirixi-ai` doesn’t just forward chat messages. It builds a synthetic “Org Snapshot” summarizing: headcount, average PRs/bugs/AI spend, top performers with stats, project coverage, and candidate bench. That context is prepended to the chat so Gemini can reference hard numbers.

3. **Responsive AI Widget**  
   The assistant is always accessible via a fixed-position button and adapts to mobile screens (full-width) while limiting height to 80vh so it never overflows.

4. **Backend Indexing**  
   On startup we create indexes for all high-volume collections (GitHub users, dates, score hashes) so queries stay fast even with large demo datasets.

5. **Scriptable Fake Data**  
   `backend/fake_data` contains both a mega `mongo_seed.json` and per-collection files. Scripts in `backend/scripts/` link prompts/actions to engineers, ensuring relationships feel real during demos.

---

## Running Locally

### Requirements
- Node.js 20+ (recommended)
- Python 3.11+
- pnpm (`npm install -g pnpm`)
- MongoDB locally or Atlas URI

### Environment Variables

Create `.env.local` at the project root for the frontend:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_SERVER_API_URL=http://localhost:8000/api/v1
```

Create `backend/.env` (copy from `.env.example`) with:
```
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=stirixi_ai_atl
CORS_ORIGINS=http://localhost:3000
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_KEYPAIR_PATH=../deploy/stirixi-authority.json
SOLANA_SBT_MINT=2dC2AxMLWncw5qaHgwjKA9V3PdYhPjjrTwqD6LocwBzi
GEMINI_API_KEY=<your-key>   # optional; frontend falls back to provided demo key
STIRIXI_AI_MODEL=gemini-2.5-flash
```

> Hackathon Note: The repository already includes `deploy/stirixi-authority.json` and a Devnet mint. No wallet setup is required to demo SBTs.

### Install + Run

```bash
# frontend
pnpm install
pnpm dev   # http://localhost:3000

# backend (from /backend)
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:3000/dashboard` and click “Chat with StirixiAI” in the bottom-right to show the copilot.

---

## API Snapshot

| Endpoint | Description |
| -------- | ----------- |
| `GET /api/v1/engineers/` | List engineers |
| `POST /api/v1/engineers/` | Create engineer |
| `GET /api/v1/engineers/{id}` | Retrieve engineer |
| `PUT /api/v1/engineers/{id}` | Update engineer |
| `DELETE /api/v1/engineers/{id}` | Remove engineer |
| `POST /api/v1/engineers/{id}/scores` | Publish + mint SBT snapshot |
| `GET /api/v1/engineers/{id}/scores` | History (newest first) |
| `GET /api/v1/engineers/{id}/scores/latest` | Most recent score |
| `GET /api/v1/projects/` | Projects with engineer/prospect IDs |
| `GET /api/v1/prospects/` | Candidate pipeline |
| `GET /api/v1/prompts/` | Prompt usage history (AI spend) |
| `GET /api/v1/actions/` | Activity timeline |
| `POST /api/stirixi-ai` | Gemini assistant bridge |

All endpoints return JSON with Pydantic validation.

---

## Deployment Playbook

1. **Build:** `pnpm build` (frontend) and `docker build` (backend if deploying separately).  
2. **Docker Compose:** use `deploy/docker-compose.prod.yml` to bring up `frontend`, `backend`, and `mongo` services with shared env file.  
3. **GitHub Actions (`.github/workflows/deploy.yml`):**  
   - Builds/pushes GHCR images for both services.  
   - SSHes into your Vultur VM (IP `104.156.255.210` by default), logs into GHCR, pulls images, and runs `docker compose up -d`.  
   - Seeds `.env` with `GEMINI_API_KEY`, `SOLANA` config, DB credentials, and `NEXT_PUBLIC_API_URL`.  
4. **Secrets:** Add `VULTUR_HOST`, `VULTUR_USER`, `VULTUR_PASSWORD`, `GHCR_DEPLOY_USERNAME`, `GHCR_DEPLOY_TOKEN`, `MONGODB_URL`, `MONGODB_DB_NAME`, `NEXT_PUBLIC_API_URL`, `NEXT_SERVER_API_URL`, and `CORS_ORIGINS` to GitHub Actions secrets.

---

## Roadmap

- Plug real GitHub/GitLab data sources into the backend ingestion pipeline.
- Extend StirixiAI with retrieval-augmented responses (RAG) over PR descriptions + incidents.
- Issue and verify SBTs for prospects (candidate wallets) to prove past employment.
- Add role-based access control (Supabase Auth or Auth0) for enterprise readiness.
- Introduce board-ready report generation (PDF export) from StirixiAI prompts.

---

## Credits

Built with ❤️ for the Major League Hacking community to highlight how AI copilots, blockchain attestations, and full-stack observability can converge into a single “CTO operating system.” Enjoy the demo and feel free to fork + extend! 🚀
