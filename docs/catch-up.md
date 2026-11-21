# Catch-up checklist (Weeks 1-4)

## About me and my app

- App name: MedTrack Demo
- Idea: helps adults who take several medicines a day tick off each dose and see at a glance what is still to take.
- GitHub username: chaitanyaaggarwal9
- Computer: Mac
- Repo: https://github.com/chaitanyaaggarwal9/medtrack-demo-
- Netlify project: medtrack-demo-k7cda
- Addresses:
  - dev (development): https://dev--medtrack-demo-k7cda.netlify.app
  - test (staging): https://test--medtrack-demo-k7cda.netlify.app
  - main (production): https://medtrack-demo-k7cda.netlify.app

## Notes

- Catch-up started 21 Nov 2026. A lot was already done; each step was checked.
- Versions: Git 2.54.0, Node.js v26.12.1, npm 11.20.0

## Week 1: Setup and my idea

- [x] 1. Git and Node.js installed
- [x] 2. Product brief (docs/brief.md: all 8 headings, safety rules OK)

## Week 2: Git, GitHub and my project

- [x] 3. Git name and noreply email set up (already correct)
- [x] 4. GitHub repo created (Public) and cloned; folder linked to origin
- [x] 5. Scaffold: React + Vite + TS, Tailwind, Router, ESLint, Prettier, Vitest; strict TS; all checks pass
- [x] 6. Start the app (Explorer > NPM SCRIPTS > ▶ dev) and open http://localhost:5173
- [x] 7. CLAUDE.md: product line, no real data, stack, commands, all rules incl. Git rules
- [x] 8. .claude/settings.json (denies .env, .env.*, *.pem), docs/brief.md, PR template, .gitignore
- [x] 9. Setup commit: done a safer way, via feature/scaffold + PR #1 into dev
- [x] 10. Branches main, test, dev exist on GitHub
- [x] 11. Landing page via feature/landing-page + PR #2 into dev
- [x] 12. One Issue per main feature: #4 Today's checklist, #9 Add/edit/delete medicine,
      #10 Overdue note, #11 Weekly view, #12 Sign in with Google (+ #13 About page)

## Week 3: Specs, my AI team and my screens

- [x] 13. AI team agents in .claude/agents (PR #3)
- [x] 14. User stories + Given/When/Then criteria in Issues #4, #9-#13
- [x] 15. Main screens
  - [x] Today's checklist (PR #5)
  - [ ] Add medicine page: only a placeholder so far (Issue #9)
  - [x] Edge-case tests: PR #15 merged into dev
  - [ ] Later: Weekly view (#11), Overdue note (#10) when we build them
- [x] 16. About page: PR #14 merged into dev (Claude reviewed as stand-in buddy; 62 tests pass)

## Week 4: Put my app on the internet

- [x] 17. Netlify project medtrack-demo-k7cda; Project ID + token saved as GitHub secrets
- [x] 18. Repo secrets, environments development/staging/production with APP_ENV, APP_URL
      and 5 not-set-yet secrets; production deploys only from main
- [x] 19. Pipeline via feature/pipeline (PR #6); dev deploy ran green
- [ ] 20. Release dev -> test -> main
  - [x] PR #8 (dev -> test) merged 21 Nov 2026; staging deploy green.
  - [x] PR #17 (dev -> test, with README) merged; staging deploy green.
  - [x] PR #18 (test -> main) merged 21 Nov 2026.
  - [ ] In GitHub Actions: REJECT the old run "Merge pull request #7" (old code),
        then APPROVE the run "Merge pull request #18". Then check the production address.
- [x] 22b. README updated with live site links, features, pages (PR #16)
- [x] 21. Ruleset protect-main-test-dev: active; main, test, dev; no deletion, no force push,
      PR required (0 approvals), status check "quality"
- [x] 22. Status badge + "How we ship" in README.md

## Later: METY Master Project Prompt

- Saved in docs/master-prompt.md (21 Nov 2026). NOT started yet.
- When I say so: check the whole project against it and list what is
  missing (for example Privacy, Terms, Accessibility, Contact, Security
  pages, security headers, docs/security.md, dependabot, security.txt).

## Data model (prep for Week 5)

- docs/data-model.md: tables users, medicines, dose_logs (saved 21 Nov 2026)
- .env.example created (names only); copied to .env (ignored by Git, never committed)
- docs/demo-data.json: 112 fake rows (3 users, 12 medicines, 97 dose logs, 15-21 Nov 2026)

## Things only I can do (in the browser)

- Dev address shows a Netlify login page: that is Netlify protecting non-production
  deploys. Log in to Netlify in the same browser to see it.
- Ask my buddy to review the PRs, then merge them.
- Approve the production deploy (at most twice a week).
