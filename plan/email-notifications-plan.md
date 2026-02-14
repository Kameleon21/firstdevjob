# Email Notifications Plan (Phase 1: Admin + Moderator Only)

This version scopes Phase 1 to staff-only emails (admins + moderators). User subscriber emails move to a later phase or separate branch.

## Scope

1. Send email alerts to admins and moderators when a new job is submitted (`pending`).
2. Do not ship user subscribe/confirm/unsubscribe in Phase 1.
3. Keep all email delivery asynchronous via Convex actions.

This plan is for the current stack (Next.js + Convex + Clerk).

## Why This Fits Current Code

- New submissions happen in `convex/jobs.ts` via `postJob`.
- Staff moderation lives in `convex/admin.ts` with roles `moderator` and `admin`.
- `postJob` can schedule a fire-and-forget action using `ctx.scheduler.runAfter(0, ...)`.

## Important Constraint in Current Schema

`profiles` currently stores role but not email. For role-based notification delivery, use one of these:

1. `STAFF_NOTIFICATION_EMAILS` env var (recommended for Phase 1 speed).
2. Add `notificationEmail` to `profiles` and maintain it for moderators/admins.

For this Phase 1, use option 1 and keep schema changes minimal.

## Phase 1 Implementation Plan (Staff Alerts Only)

### 1) Add Resend component wiring in Convex

Files:

- `convex/resend.ts` (new)
- `convex/notifications.ts` (new)

Plan:

1. Configure `Resend` component in Convex.
2. Set `from` via env (`EMAIL_FROM`).
3. Ensure `testMode` is disabled in production.

### 2) Add internal action to send staff notification

Files:

- `convex/notifications.ts` (new)

Action:

- `internal.notifications.sendNewSubmissionStaffEmail({ jobId })`

Flow:

1. Load job by `jobId`.
2. Build a concise email (title/company/location/url + moderation link).
3. Send to `STAFF_NOTIFICATION_EMAILS` recipients.
4. Log failures, but do not throw in a way that breaks user submission flow.

### 3) Trigger staff notification from job submission

Files:

- `convex/jobs.ts`

Flow:

1. Keep existing `postJob` insert behavior unchanged.
2. After insert, schedule action:
   `ctx.scheduler.runAfter(0, internal.notifications.sendNewSubmissionStaffEmail, { jobId })`.
3. Return success immediately to client.

### 4) Guardrails and reliability

1. Skip sending if recipient list is empty (log warning).
2. Add idempotency key strategy if retries become noisy.
3. Keep action retries safe by making message content deterministic.

## Environment Variables

Add/update in `.env.example`:

- `RESEND_API_KEY=...`
- `EMAIL_FROM=hello@yourdomain.com`
- `STAFF_NOTIFICATION_EMAILS=admin@yourdomain.com,moderator@yourdomain.com`
- `EMAIL_REPLY_TO=you@yourdomain.com` (optional)
- `NEXT_PUBLIC_SITE_URL=https://firstdevjob.com`

## Sender Address Decision (Your Question)

As of February 14, 2026:

1. If your domain is verified in Resend, you can send from addresses on that domain (for example, `hello@yourdomain.com`).
2. You do not need to use your personal email as the sender.
3. If you want to receive replies, set `replyTo` to a mailbox you monitor (or create forwarding for the sender address).

## Rollout Phases

### Phase 1 (this branch, 1 day)

1. Resend component setup in Convex.
2. Staff notification action.
3. Trigger from `postJob`.
4. Manual validation with admin/moderator recipient list.

### Phase 2 (separate branch)

1. User subscriptions table + verification/unsubscribe flows.
2. Trigger user notifications on `approved` status transition.
3. Rate limiting and send deduplication.

### Phase 3

1. Digest mode (`instant` vs `daily`).
2. Per-user filters.
3. Notification delivery metrics.

## Testing Plan (Phase 1)

1. Unit:
   - action payload formatting and empty-recipient handling.
2. Integration:
   - `postJob` schedules staff notification action.
3. Manual:
   - submit job -> admin/moderator emails received.
   - invalid/missing recipient config -> submission still succeeds, warning logged.
