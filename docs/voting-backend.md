# Voting backend

Real votes and predictions for Cotometru. Status: phase 1 is built and tested locally, not yet deployed.

## Running it locally

```
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev:api
```

The site with the working API is then at http://localhost:8787. No Cloudflare account is needed for this.
`npm run dev` on port 4321 still works for page work and forwards `/api` to port 8787 when the API is running.

## Deploying

1. `npx wrangler login`
2. `npx wrangler d1 create cotometru`, then put the printed database id into `wrangler.jsonc`
3. `npm run db:migrate`
4. `npx wrangler secret put COOKIE_SECRET` and `npx wrangler secret put ADMIN_TOKEN` (long random strings)
5. `npm run deploy`

The GitHub Pages copy keeps working without the backend: predictions there stay on the visitor's device.

## Not built yet

- Turnstile bot check on the vote buttons
- Per-episode odds history from real votes (the chart and the trend still use the editorial numbers)
- Scoring and leaderboard (outcomes can be recorded through `POST /api/admin/outcome`)

## Summary

The pages stay static. A small backend on the same Cloudflare account handles voting and results:
one database, about five endpoints and one scheduled job.

## Pieces

| Piece | What it is |
|---|---|
| API routes | Server functions in this Astro project, running on Cloudflare Workers |
| D1 database | SQLite hosted by Cloudflare, plain SQL |
| Scheduled job | A function Cloudflare runs every minute to recompute the odds |
| Turnstile | Cloudflare's invisible bot check on the vote buttons |
| Secrets | Keys stored in Cloudflare, never in the repo |

## How voting works

1. **Identity without accounts.** On a visitor's first vote the server sets a random ID in a signed cookie.
   One visitor gets one pick per couple per episode and can change it until closing time.
2. **Casting a vote.** The browser sends the couple and the scenario. The server checks the bot token,
   checks the closing time against the schedule (`src/lib/schedule.ts`), and saves the pick together
   with the cota at that moment.
3. **Computing the odds.** Every minute the scheduled job counts the picks per couple and writes the
   result to one cached file. Visitors read that file, never the database.
4. **Blended odds.** The editorial numbers act as a starting weight (for example, worth 50 votes).
   Odds begin at the editorial estimate and drift toward the community as votes arrive.
5. **Scoring.** When a couple's outcome airs, it is recorded once. A correct pick earns 100 times
   the cota it was made at.

## Endpoints

| Method and path | Purpose |
|---|---|
| `POST /api/predictions` | Save or change a pick for one couple |
| `POST /api/poll` | Save a poll answer |
| `GET /api/me` | Return the visitor's own picks |
| `GET /api/odds/:show` | Return the cached odds file |
| `POST /api/admin/outcome` | Record a final outcome (protected by a secret) |

## Data

| Table | Holds |
|---|---|
| `visitors` | Random visitor ID, first seen date |
| `predictions` | Visitor, couple, scenario, episode number, cota at pick time, timestamp |
| `poll_votes` | Visitor, poll, chosen option |
| `odds_snapshots` | Couple, episode number, the three percentages |
| `outcomes` | Couple, final scenario |

## Phases

**Phase 1: anonymous voting.** Live community odds, the poll with real results, locking at closing
time. No sign-in and no personal data beyond the cookie.

**Phase 2: sign-in and leaderboard.** Google sign-in so picks follow people across devices.
A leaderboard needs this because anonymous votes are easy to fake. It brings names and emails,
so the privacy page and account deletion become real obligations.

## Setup needed (owner)

Phase 1:

- Create the Cloudflare account and run `npx wrangler login`
- Create the D1 database and the Turnstile keys
- Deploy and test

Phase 2:

- Create a Google sign-in client in the Google Cloud console

## What changes once this exists

- Two environments: a local test database and the live one, with schema changes applied to both
  through migration files.
- Abuse: Turnstile and rate limits handle casual vote stuffing, not a determined attacker.
- Chores: recording outcomes, adjusting the editorial numbers, watching usage against the free limits.
- Privacy: the cookie and privacy pages need an update when votes are stored on a server.

## Limits and cost

- Free plan: 100,000 Worker requests a day, 100,000 database rows written a day.
- When the database limit is exceeded, voting returns errors until midnight UTC. The pages stay up.
- The paid plan is 5 USD a month and removes the problem for this scale.

## Open decisions

- The weight of the editorial numbers in the blend (50 votes is a starting guess).
- When to start phase 2.
