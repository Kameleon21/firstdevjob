# Launching FirstDevJob v0.5: A Modern Job Board for Your First Tech Role

Finding your first developer job is hard. Most job boards bury entry‑level roles or lack the context and tooling juniors actually need. FirstDevJob is my attempt to fix that: a focused, fast, and community‑friendly job board built specifically for developers looking for their first opportunity.

Today I’m shipping v0.5 (Public Beta). It’s production‑ready enough to bring in the first users, and it lays a strong foundation for rapid iteration toward 1.0.

## What is FirstDevJob?

FirstDevJob helps you:

- Discover developer jobs with clear, relevant filters (title, company, location, tags)
- Track your application progress in a private dashboard
- Submit new jobs (community‑driven) with moderation for quality

Under the hood, it’s built with Next.js 15, React 19, TypeScript, Tailwind CSS, and Supabase (database + auth + RLS). It’s fast, secure by default, and designed to scale.

## Why build it?

As a community, we need a better way to surface junior opportunities—and a place where companies who truly want to invest in junior devs can reach them. FirstDevJob focuses directly on that matchmaking, with a simple UX and clear guardrails (moderation, RLS, roles).

## What’s in v0.5 (Public Beta)

- Environment‑aware authentication with friendly production messages and rich dev logs
- Error recovery and auto‑retry for OAuth (Google/GitHub)
- Clear success notifications for email, OAuth, and password flows
- Progress indicators across sign‑in/sign‑up
- Hardened OAuth callback route with safe redirects and strict URL handling
- Middleware‑based session management via Supabase SSR utilities
- Comprehensive tests (196 passing) across actions, auth flows, components, and search
- Verified production build (type‑check, lint, build)

If you’re curious about the internals, the repo includes a detailed `docs/` folder and a security‑minded `docs/DEPLOYMENT.md`.

## What’s next on the roadmap

### Marching to 1.0

- Chrome Extension MVP for one‑click job submission from any website
- Public submission hardening: validation, rate limiting, and anti‑spam
- Admin UX: bulk approve/reject, filters, audit trail
- Observability: error tracking, uptime checks, basic analytics
- SEO: sitemap, metadata, Open Graph, robots tuning
- Email notifications: account confirmation, reset, submission status
- Saved searches and job alerts (tags/text), daily/weekly digests
- Accessibility and mobile polish; Lighthouse A11y ≥ 95
- E2E tests (Playwright/Cypress) for critical auth and posting flows

### 1.5 and beyond

- AI‑assisted job normalization (extract company, title, location, tags)
- AI search/ranking and semantic tag suggestions
- Resume parsing and profile‑to‑job matching
- Spam/duplicate detection
- Team workflows: verified posters, company profiles, moderator roles
- Integrations: Slack alerts, RSS/Atom feeds, webhooks
- Public API for approved job feeds

## Chrome Extension: how it will work

- Minimal UI to capture: title, company, location, URL, tags
- Auto‑extract metadata from the active tab; allow manual edits
- Auth via Supabase OAuth; session sharing or short‑lived tokens
- Submit to a dedicated server action endpoint (rate‑limited, moderated by default)
- Privacy‑by‑design: only URL + user‑supplied fields are sent

If you’re interested in testing the extension early, leave a comment or DM.

## Call for early users and contributors

If you’re a junior developer, try it out and share feedback—especially around search and tracking flows. If you’re a company hiring juniors, post your roles and help the community.

Contributors welcome! There are issues for backend, frontend, and testing. The stack is approachable and strongly typed end‑to‑end.

## Try it and follow along

- Repo: FirstDevJob (open source)
- Tech: Next.js, React, TypeScript, Tailwind, Supabase
- Status: v0.5 Public Beta

Thanks for reading—and if you’re searching for your first dev job, I hope this makes the journey a little easier.
