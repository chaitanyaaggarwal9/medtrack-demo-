# MedTrack Demo

[![CI-CD](https://github.com/chaitanyaaggarwal9/medtrack-demo-/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/chaitanyaaggarwal9/medtrack-demo-/actions/workflows/ci-cd.yml)

Helps adults who take several medicines a day tick off each dose and see at a glance what is still to take.

> **Learning project.** All data is fake. Do not enter real personal or health data.
> MedTrack Demo does not diagnose, calculate doses or give medical advice.
> In an emergency, call your local emergency number.

## Live sites

| Branch | Environment | Address                                       | Health check                                                            |
| ------ | ----------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `main` | production  | https://medtrack-demo-k7cda.netlify.app       | [/api/health](https://medtrack-demo-k7cda.netlify.app/api/health)       |
| `test` | staging     | https://test--medtrack-demo-k7cda.netlify.app | [/api/health](https://test--medtrack-demo-k7cda.netlify.app/api/health) |
| `dev`  | development | https://dev--medtrack-demo-k7cda.netlify.app  | [/api/health](https://dev--medtrack-demo-k7cda.netlify.app/api/health)  |

The `test` and `dev` sites are protected by Netlify: log in to Netlify to see them.

## Features

| Feature                                                                        | Status                   | Issue                                                                 |
| ------------------------------------------------------------------------------ | ------------------------ | --------------------------------------------------------------------- |
| Landing page with disclaimer                                                   | ✅ Done                  |                                                                       |
| Today's checklist: tick each dose, undo, see what is still to take (mock data) | ✅ Done                  | [#4](https://github.com/chaitanyaaggarwal9/medtrack-demo-/issues/4)   |
| About page                                                                     | ✅ Done                  | [#13](https://github.com/chaitanyaaggarwal9/medtrack-demo-/issues/13) |
| Add, edit and delete a medicine                                                | 🔜 Placeholder page only | [#9](https://github.com/chaitanyaaggarwal9/medtrack-demo-/issues/9)   |
| Overdue note                                                                   | 🔜 Planned               | [#10](https://github.com/chaitanyaaggarwal9/medtrack-demo-/issues/10) |
| Weekly view                                                                    | 🔜 Planned               | [#11](https://github.com/chaitanyaaggarwal9/medtrack-demo-/issues/11) |
| Sign in with Google                                                            | 🔜 Planned (Week 5+)     | [#12](https://github.com/chaitanyaaggarwal9/medtrack-demo-/issues/12) |

## Pages

| Address              | Page                            |
| -------------------- | ------------------------------- |
| `/`                  | Landing page                    |
| `/app`               | Today's checklist               |
| `/app/medicines/new` | Add a medicine (placeholder)    |
| `/about`             | About this app                  |
| `/api/health`        | Health check (Netlify Function) |

## Tech stack

- **Frontend:** React + Vite + TypeScript (strict) + Tailwind CSS + React Router
- **Backend:** Netlify Functions in `netlify/functions`, served under `/api/*`
- **Tests:** Vitest + React Testing Library
- **Quality:** ESLint + Prettier
- **CI/CD:** GitHub Actions deploys to Netlify
- **Database:** Neon Postgres + Drizzle ORM (schema in `src/db/schema.ts`, design in [docs/data-model.md](docs/data-model.md)); Zod validates every input
- **Coming later:** Sign in with Google, Turnstile, PostHog, Stripe (sandbox)

## How we ship

1. **Work on a feature branch** made from `dev` (`feature/<short-name>`). Nobody pushes to `dev`, `test` or `main` directly: a ruleset blocks it.
2. **Open a pull request into `dev`.** GitHub Actions runs the `quality` check: lint, typecheck, tests, build and a security audit of production packages. The PR can only be merged when it is green.
3. **Merge → automatic deploy.** Every merge runs the checks again and then deploys with Netlify to the matching address (see [Live sites](#live-sites)).
4. **Promote with PRs:** `dev` → `test` → `main`. Production deploys wait for an approval and happen at most twice a week (they use Netlify credits).
5. **Check it is live:** open `/api/health` on the address. It answers `{"status":"ok","env":"<environment>"}`.

Secrets live only in GitHub (Settings → Secrets and variables → Actions), never in the code.

## Run it locally

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (from Neon) and
   `DEMO_USER_ID=a0000000-0000-4000-8000-000000000001`. Never commit `.env`.
2. Then:

```bash
npm ci
npm run db:migrate   # create the tables
npm run db:seed      # load the fake demo data (docs/demo-data.json)
npm run dev:api      # app + API at http://localhost:8888
```

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the app locally                         |
| `npm run lint`      | Check code style and common mistakes (ESLint) |
| `npm run typecheck` | Check TypeScript types                        |
| `npm test`          | Run the tests (Vitest)                        |
| `npm run build`     | Make the production build in `dist`           |

Before opening a PR: `npm run lint && npm run typecheck && npm test && npm run build`.

## Project docs

- [Product brief](docs/brief.md)
- [Weeks 1-4 catch-up checklist](docs/catch-up.md)
- [Project rules for Claude Code](CLAUDE.md)
- AI team agents: [`.claude/agents`](.claude/agents) (product-manager, qa-tester, code-reviewer, security-reviewer)
