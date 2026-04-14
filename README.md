# Boost33 Prospecting OS

Full-stack LinkedIn prospecting management platform built with Next.js 14, Supabase, and Tailwind CSS.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS, dark theme
- **Automation**: n8n webhook integration
- **API**: Prosp API (server-side proxy)

## Modules

1. **Scraping Tracker** — Track LinkedIn post URLs, scraping status, and raw profile counts per desk
2. **CEO Filter** — Upload Apollo/Prosp CSVs, auto-detect columns, filter CEO/Founder titles (FR+EN), deduplicate, export filtered CSV
3. **Campaign Setup** — Create campaigns with templates, scheduling, API keys, and n8n webhook config
4. **Review & Kickoff** — Pre-launch checklist and one-click campaign activation via n8n webhook
5. **Pipeline Stats** — Manual input of sent/accepted/replies/RDV per desk per week with computed rates and progress bars

## Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd boost33-prospecting-os
npm install
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the full schema:

```bash
# Copy contents of supabase/schema.sql into Supabase SQL Editor and execute
```

3. Enable Email/Password auth in Authentication > Providers
4. Create user accounts in Authentication > Users

### 3. Environment Variables

```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key from Settings > API
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Database Schema

See `supabase/schema.sql` for the full schema. Tables:

| Table | Purpose |
|-------|---------|
| `posts` | LinkedIn post URLs + scraping status |
| `filter_sessions` | CEO filter run history |
| `templates` | Message templates per sector/persona/lang |
| `campaigns` | Campaign config, schedule, status |
| `pipeline_stats` | Weekly outreach metrics per desk |
| `settings` | Key-value store (webhook URLs, etc.) |

## Desks

Three desks are supported: **Arthur**, **Boost33**, **Advisor**

## CEO Title Keywords

Filter matches these titles in both `jobTitle` and `headline` columns:

CEO, Founder, Co-Founder, PDG, DG, Directeur Général, Gérant, Président, Fondateur, Cofondateur, Managing Director, Owner, Entrepreneur
