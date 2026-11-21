# MedTrack Demo

[![CI-CD](https://github.com/chaitanyaaggarwal9/medtrack-demo-/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/chaitanyaaggarwal9/medtrack-demo-/actions/workflows/ci-cd.yml)

Helps adults who take several medicines a day tick off each dose and see at a glance what is still to take.

> **Learning project.** Do not enter real patient data. MedTrack does not diagnose or give medical advice.

## How we ship

1. **Work on a feature branch** made from `dev` (`feature/<short-name>`). Nobody pushes to `dev`, `test` or `main` directly: a ruleset blocks it.
2. **Open a pull request into `dev`.** GitHub Actions runs the `quality` check: lint, typecheck, tests, build and a security audit of production packages. The PR can only be merged when it is green.
3. **Merge → automatic deploy.** Every merge runs the checks again and then deploys with Netlify:

   | Branch | Environment | Address |
   |---|---|---|
   | `dev` | development | https://dev--medtrack-demo-k7cda.netlify.app |
   | `test` | staging | https://test--medtrack-demo-k7cda.netlify.app |
   | `main` | production | https://medtrack-demo-k7cda.netlify.app |

4. **Promote with PRs:** `dev` → `test` → `main`. Production deploys wait for an approval and happen at most twice a week (they use Netlify credits).
5. **Check it is live:** open `/api/health` on the address. It answers `{"status":"ok","env":"<environment>"}`.

Secrets live only in GitHub (Settings → Secrets and variables → Actions), never in the code.

## Run it locally

```bash
npm ci
npm run dev        # http://localhost:5173
```

Before opening a PR: `npm run lint && npm run typecheck && npm test && npm run build`.
