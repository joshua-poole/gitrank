# GitHub Ranked

A competitive ranking system for GitHub profiles. Users get an Elo rating and a tier rank (Plastic through Diamond to Linus) based on their GitHub activity — repos, stars, forks, commits, issues, and PRs. Built for a hackathon.

## Features

- **Rank** — Enter a GitHub username to calculate their rank and Elo score
- **Leaderboard** — Seasonal leaderboard with positional rankings
- **Compare** — Head-to-head comparison between two GitHub users
- **Dashboard** — Per-user profile page with stats and badges
- **Badges & Challenges** — Earn badges by completing challenges

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | TanStack Start, React 19, Tailwind CSS, Shadcn, Recharts |
| API | tRPC |
| Database | PostgreSQL (Neon), Prisma ORM |
| Scoring | Python (FastAPI), custom Elo algorithm |
| Deployment | Vercel |

## Repo Structure

```
src/
  routes/          # File-based routing (TanStack Router)
    rank/          # Rank lookup page
    leaderboard/   # Seasonal leaderboard
    compare/       # Head-to-head comparison
    dashboard/     # User profile pages
    about/
  features/        # Feature-specific components
  server/          # tRPC server (clients, services)
  schemas/         # Zod schemas
  integrations/    # External service integrations
  components/      # Shared UI components
  types/           # TypeScript types
ml/
  scoring/         # Elo scoring algorithm (Python)
  src/             # ML models and data
prisma/
  schema.prisma    # Database schema
  migrations/      # Database migrations
  seed.ts          # Seed script
db/
  init.sql         # Database init script
```

## Prerequisites

- [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/)
- [Docker](https://docs.docker.com/engine/install/) or [Podman](https://podman.io/getting-started/installation)
- [uv](https://docs.astral.sh/uv/) (for the Python scoring service)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start a local Postgres database (requires Docker/Podman)
./start-database.sh

# Run migrations and seed
pnpm db:migrate
pnpm db:seed

# Run the dev server (port 3000)
pnpm dev
```

The `start-database.sh` script reads `DATABASE_URL` from your `.env` file, spins up a Postgres container, and will prompt to generate a random password if you're using the default. On Windows, run the script from WSL.

Alternatively, the Neon Vite plugin will auto-create a claimable dev database if one isn't configured (expires in 72 hours).

### Other Database Commands

```bash
pnpm db:studio     # Open Prisma Studio
pnpm db:push       # Push schema without migrations
pnpm db:generate   # Regenerate Prisma client
```

## Python Scoring Service

```bash
cd ml
uv sync
# See ml/scoring/algo.py for the Elo algorithm
```
