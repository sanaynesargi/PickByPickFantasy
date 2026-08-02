# Pick for Pick 🏈

A mobile-friendly **fantasy football draft-order** app. Selection order is the
**reverse of last year's standings** — the team that finished worst picks its
draft slot first, then the next-worst, and so on. When you're on the clock you
**choose any open draft slot**, and the board updates live for everyone.

Built with **Next.js (App Router) + Material UI**, backed by **Postgres** via
Drizzle ORM. Deployable to **Vercel** with a Neon Postgres database.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. No database setup required — with `DATABASE_URL`
unset the app runs an **embedded PGlite Postgres** persisted under `./.pglite`.
On the home screen, hit **Load demo league** to seed 8 teams and start drafting.

## Deploy to Vercel (with a real DB)

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new).
2. In the project, add a database: **Storage → Create → Neon (Postgres)**.
   Vercel injects `DATABASE_URL` automatically.
3. Redeploy. The same code now runs against Neon — tables are created on first
   request (idempotent `CREATE TABLE IF NOT EXISTS`).

To develop locally against the same cloud DB, copy `.env.example` to `.env` and
set `DATABASE_URL` to your Neon connection string.

## How the draft works

- Teams and last-year records live in the DB (edit them on **/admin**).
- Standings rank by points (win = 1, tie = 0.5), tie-broken by fewer losses.
- **Selection order = standings reversed** (worst → best).
- The first team in that order without a slot is *on the clock* and picks any
  remaining slot number `1..N`. Repeat until every team has a slot.
- **Reset draft** clears picks but keeps teams.

## Structure

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Live draft board (on-the-clock, slots, order) |
| `app/admin/page.tsx` | Add/edit teams & records |
| `app/api/*` | State, teams CRUD, pick, reset, seed |
| `lib/db.ts` | Driver selection: Neon (prod) / PGlite (local) |
| `lib/draft.ts` | Standings + reverse-order draft logic |
| `lib/schema.ts` | Drizzle schema (`teams`, `picks`) |
