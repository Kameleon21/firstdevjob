# Convex Migration Plan

Migration from Supabase (PostgreSQL + Auth) to Convex with Convex Auth.

**Strategy**: Incremental (feature-by-feature, Supabase runs in parallel until fully replaced)
**Auth Solution**: Convex Auth (native)
**Data Migration**: Fresh start (no existing data import)
**Estimated Effort**: 14-21 hours

---

## Current State Summary

### Supabase Integration Points

| Area             | Files          | Details                                                                          |
| ---------------- | -------------- | -------------------------------------------------------------------------------- |
| Supabase clients | 3 files        | Browser, Server, Service clients in `src/lib/supabase/`                          |
| Server actions   | 6 action files | `admin.ts`, `bookmarks.ts`, `dashboard.ts`, `jobs.ts`, `profile.ts`, `search.ts` |
| Auth actions     | 1 file         | `src/app/auth/actions.ts` (email login, signup, OAuth, password reset, sign-out) |
| Auth callback    | 1 route        | `src/app/auth/callback/route.ts` (OAuth code exchange)                           |
| Middleware       | 1 file         | `src/middleware.ts` (session refresh)                                            |
| Auth components  | 3 files        | `AuthModal.tsx`, `Header.tsx`, `useAuth.ts` hook                                 |
| Auth helpers     | 2 files        | `errorHandling.ts`, `errorRecovery.ts`                                           |
| Pages            | 2 files        | `reset-password/page.tsx`, `profile/page.tsx`                                    |
| Tests            | 196 tests      | Mock Supabase clients, need full rewrite                                         |

### Database Tables

| Table                  | Columns                                                                          | Notes                                         |
| ---------------------- | -------------------------------------------------------------------------------- | --------------------------------------------- |
| `profiles`             | `id` (uuid), `full_name`, `role` (app_role)                                      | 1:1 with auth.users                           |
| `job`                  | `id`, `title`, `company`, `location`, `url`, `status` (job_status), `created_at` | Status workflow: pending -> approved/rejected |
| `tags`                 | `id`, `name` (unique)                                                            | Centralized tag definitions                   |
| `job_tags`             | `job_id`, `tag_id`                                                               | Many-to-many join table                       |
| `tracked_applications` | `id`, `user_id`, `job_id`, `status` (application_status), `notes`                | Per-user bookmark/tracking                    |

### Enums

- `app_role`: user, moderator, admin
- `job_status`: pending, approved, rejected
- `application_status`: saved, applied, interviewing, offer, rejected, accepted

### RLS Policies (9 total)

All tables have RLS enabled. Authorization logic is enforced at the database level via a `get_user_role()` helper function. In Convex, all of this moves to function-level authorization checks.

### Database Operations Count

- **Auth operations**: ~15 (signIn, signUp, signOut, getSession, updateUser, etc.)
- **Database reads**: ~11 SELECT queries across 5 action files
- **Database writes**: ~8 INSERT/UPDATE/DELETE/UPSERT operations
- **Cache invalidation**: 8 `revalidatePath()` calls (eliminated by Convex reactivity)

---

## Phase 0: Project Setup & Convex Initialization

Status: Completed

**Goal**: Get Convex running alongside Supabase without changing any existing functionality.

**Duration**: ~1-2 hours

### Steps

1. **Install Convex dependencies**

   ```bash
   npm install convex @convex-dev/auth @auth/core
   ```

2. **Initialize Convex project**

   ```bash
   npx convex dev
   ```

   This creates:
   - `convex/` directory with `_generated/` folder
   - `convex.json` at root

3. **Define the full schema** in `convex/schema.ts`

   ```typescript
   import { defineSchema, defineTable } from "convex/server";
   import { v } from "convex/values";

   export default defineSchema({
     profiles: defineTable({
       userId: v.string(), // Convex Auth user ID
       fullName: v.optional(v.string()),
       role: v.union(
         v.literal("user"),
         v.literal("moderator"),
         v.literal("admin"),
       ),
     }).index("by_userId", ["userId"]),

     jobs: defineTable({
       title: v.string(),
       company: v.string(),
       location: v.optional(v.string()),
       url: v.optional(v.string()),
       status: v.union(
         v.literal("pending"),
         v.literal("approved"),
         v.literal("rejected"),
       ),
       tags: v.optional(v.array(v.string())), // Embed tag names directly
     }),

     tags: defineTable({
       name: v.string(),
     }).index("by_name", ["name"]),

     trackedApplications: defineTable({
       userId: v.string(),
       jobId: v.id("jobs"),
       status: v.union(
         v.literal("saved"),
         v.literal("applied"),
         v.literal("interviewing"),
         v.literal("offer"),
         v.literal("rejected"),
         v.literal("accepted"),
       ),
       notes: v.optional(v.string()),
     })
       .index("by_userId", ["userId"])
       .index("by_userId_jobId", ["userId", "jobId"]),
   });
   ```

   **Schema design decisions**:
   - `job_tags` join table is eliminated. Tags are embedded as a string array on the `jobs` document. This is idiomatic for Convex since jobs typically have a small number of tags (< 20).
   - A separate `tags` table is kept for the tag autocomplete/listing feature.
   - `profiles.userId` stores the Convex Auth identity token subject, not a Convex document ID.

4. **Add ConvexProvider** to root layout

   ```typescript
   // src/app/providers.tsx (new client component)
   "use client";
   import { ConvexProvider, ConvexReactClient } from "convex/react";

   const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

   export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
     return <ConvexProvider client={convex}>{children}</ConvexProvider>;
   }
   ```

   Wrap existing layout with this provider alongside current Supabase setup.

5. **Set up environment variables**
   - Add to `.env.local`:

     ```
     NEXT_PUBLIC_CONVEX_URL=<from Convex dashboard>
     ```

   - Add to Convex dashboard (for server-side functions):
     - OAuth client IDs/secrets (Google, GitHub) -- set up later in Phase 2

### Verification

- `npx convex dev` runs without errors
- App still works with all existing Supabase functionality
- Convex dashboard shows the schema deployed

---

## Phase 1: Migrate Public Data (Jobs, Tags, Search)

Status: Completed

**Goal**: Replace Supabase queries for public job listings and search with Convex functions.

**Duration**: ~3-4 hours

**Files affected**:

- `src/app/actions/search.ts` (replaced by Convex queries)
- Components rendering job lists (updated to use `useQuery`)

### Steps

1. **Create Convex query functions**

   `convex/jobs.ts`:

   ```typescript
   import { query } from "./_generated/server";
   import { v } from "convex/values";

   // Replaces searchJobs() in search.ts
   export const listApprovedJobs = query({
     args: {
       searchTerm: v.optional(v.string()),
       selectedTags: v.optional(v.array(v.string())),
     },
     handler: async (ctx, args) => {
       let jobs = await ctx.db
         .query("jobs")
         .filter((q) => q.eq(q.field("status"), "approved"))
         .order("desc")
         .collect();

       // Filter by search term (title, company, location)
       if (args.searchTerm) {
         const term = args.searchTerm.toLowerCase();
         jobs = jobs.filter(
           (j) =>
             j.title.toLowerCase().includes(term) ||
             j.company.toLowerCase().includes(term) ||
             (j.location?.toLowerCase().includes(term) ?? false),
         );
       }

       // Filter by tags
       if (args.selectedTags && args.selectedTags.length > 0) {
         jobs = jobs.filter((j) =>
           args.selectedTags!.some((tag) => j.tags?.includes(tag)),
         );
       }

       return jobs;
     },
   });
   ```

   `convex/tags.ts`:

   ```typescript
   import { query } from "./_generated/server";

   // Replaces getAllTags() in search.ts
   export const getAllTags = query({
     args: {},
     handler: async (ctx) => {
       const tags = await ctx.db.query("tags").collect();
       return tags.map((t) => t.name).sort();
     },
   });
   ```

2. **Update components** to use `useQuery()` from `convex/react`

   Replace server action calls:

   ```typescript
   // Before (Supabase)
   const jobs = await searchJobs(searchTerm, tags);

   // After (Convex)
   import { useQuery } from "convex/react";
   import { api } from "../../convex/_generated/api";

   const jobs = useQuery(api.jobs.listApprovedJobs, {
     searchTerm,
     selectedTags,
   });
   ```

   These queries are now **real-time** -- any new approved job automatically appears without page refresh or `revalidatePath`.

3. **Seed initial data** for testing
   - Create a seed script or use Convex dashboard to add test tags and jobs

4. **Keep Supabase running** for auth and bookmarks during this phase

### Verification

- Job listing page loads jobs from Convex
- Search by title/company/location works
- Tag filtering works
- New jobs appear in real-time when added via Convex dashboard
- All other features (auth, bookmarks, admin) still work via Supabase

---

## Phase 2: Migrate Authentication

**Goal**: Replace Supabase Auth with Convex Auth (Google, GitHub, email/password).

**Duration**: ~4-6 hours

**Files to modify/replace**:

- `src/middleware.ts` -- simplify (remove Supabase session refresh)
- `src/hooks/useAuth.ts` -- rewrite for Convex Auth
- `src/components/AuthModal.tsx` -- rewrite sign-in/sign-up logic
- `src/components/Header.tsx` -- replace sign-out

**Files to delete**:

- `src/app/auth/actions.ts`
- `src/app/auth/callback/route.ts`
- `src/app/auth/reset-password/page.tsx` (rebuild if needed)
- `src/lib/auth/errorHandling.ts`
- `src/lib/auth/errorRecovery.ts`
- `src/lib/supabase/client.ts` (after all features migrated)
- `src/lib/supabase/server.ts` (after all features migrated)

### Steps

1. **Configure Convex Auth**

   `convex/auth.config.ts`:

   ```typescript
   export default {
     providers: [
       {
         domain: process.env.CONVEX_SITE_URL,
         applicationID: "convex",
       },
     ],
   };
   ```

   Set up OAuth providers (Google, GitHub) following Convex Auth docs. Configure client IDs and secrets in Convex dashboard environment variables.

2. **Create auth-related Convex functions**

   `convex/auth.ts`:
   - After-signup hook to create a profile document automatically
   - This replaces the Supabase trigger that creates a profile row on user signup

   `convex/users.ts`:

   ```typescript
   import { query, mutation } from "./_generated/server";

   export const currentUser = query({
     args: {},
     handler: async (ctx) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) return null;

       const profile = await ctx.db
         .query("profiles")
         .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
         .unique();

       return profile;
     },
   });
   ```

3. **Update ConvexProvider** to include auth

   ```typescript
   "use client";
   import { ConvexReactClient } from "convex/react";
   import { ConvexProviderWithAuth } from "convex/react";
   // Configure with Convex Auth provider

   const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
   ```

4. **Rewrite `useAuth` hook**
   - Replace `supabase.auth.onAuthStateChange` with `useConvexAuth()` from `convex/react`
   - Provides `isAuthenticated`, `isLoading`

5. **Rewrite `AuthModal.tsx`**
   - OAuth buttons call Convex Auth `signIn` with Google/GitHub provider
   - Email/password form calls Convex Auth `signIn`/`signUp`
   - Remove Supabase browser client usage

6. **Rewrite `Header.tsx` sign-out**
   - Replace `supabase.auth.signOut()` with Convex Auth `signOut()`

7. **Simplify `middleware.ts`**
   - Remove Supabase session refresh logic
   - Convex Auth manages sessions client-side via JWT tokens
   - Middleware may become a no-op or can be removed entirely

8. **Handle password reset** -- implement via Convex Auth's password reset flow if needed, or defer

### Verification

- Sign up with email/password works
- Sign in with Google OAuth works
- Sign in with GitHub OAuth works
- Sign out works
- Session persists across page refreshes
- Protected pages redirect unauthenticated users
- User profile is created on first sign-up

---

## Phase 3: Migrate Auth-Dependent Features

**Goal**: Move bookmarks, profiles, admin, and job posting to Convex.

**Duration**: ~4-6 hours

**Files to replace**:

- `src/app/actions/bookmarks.ts` -> `convex/bookmarks.ts`
- `src/app/actions/profile.ts` -> `convex/profiles.ts`
- `src/app/actions/admin.ts` -> `convex/admin.ts`
- `src/app/actions/dashboard.ts` -> `convex/dashboard.ts`
- `src/app/actions/jobs.ts` -> `convex/jobs.ts` (add mutation)

### Steps

1. **Migrate profiles** (replaces `src/app/actions/profile.ts`)

   `convex/profiles.ts`:

   ```typescript
   export const getUserProfile = query({ ... });
   export const updateUserName = mutation({ ... });
   export const deleteAccount = mutation({ ... });
   export const changePassword = mutation({ ... }); // via Convex Auth
   ```

   **Authorization pattern** (replaces RLS):

   ```typescript
   handler: async (ctx, args) => {
     const identity = await ctx.auth.getUserIdentity();
     if (!identity) throw new Error("Not authenticated");
     // Check identity.subject matches the profile being accessed
   };
   ```

2. **Migrate bookmarks** (replaces `src/app/actions/bookmarks.ts`)

   `convex/bookmarks.ts`:

   ```typescript
   export const toggleBookmark = mutation({ ... });
   export const getBookmarkStatus = query({ ... });
   export const getUserBookmarks = query({ ... });
   export const updateBookmarkStatus = mutation({ ... });
   ```

   Authorization: verify `userId` matches authenticated user in every function.

3. **Migrate job posting** (add to `convex/jobs.ts`)

   ```typescript
   export const postJob = mutation({
     args: {
       title: v.string(),
       company: v.string(),
       location: v.optional(v.string()),
       url: v.optional(v.string()),
       tags: v.optional(v.array(v.string())),
     },
     handler: async (ctx, args) => {
       // No need for service client -- Convex mutations have full DB access
       const jobId = await ctx.db.insert("jobs", {
         ...args,
         status: "pending",
       });

       // Upsert tags to the tags table for autocomplete
       if (args.tags) {
         for (const tagName of args.tags) {
           const existing = await ctx.db
             .query("tags")
             .withIndex("by_name", (q) => q.eq("name", tagName))
             .unique();
           if (!existing) {
             await ctx.db.insert("tags", { name: tagName });
           }
         }
       }

       return jobId;
     },
   });
   ```

4. **Migrate admin features** (replaces `src/app/actions/admin.ts`)

   `convex/admin.ts`:

   ```typescript
   // Helper: check if current user is moderator or admin
   async function requireModOrAdmin(ctx) {
     const identity = await ctx.auth.getUserIdentity();
     if (!identity) throw new Error("Not authenticated");
     const profile = await ctx.db
       .query("profiles")
       .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
       .unique();
     if (!profile || !["moderator", "admin"].includes(profile.role)) {
       throw new Error("Unauthorized");
     }
     return profile;
   }

   export const getPendingJobs = query({ ... });   // check mod/admin role
   export const getPendingJobsCount = query({ ... });
   export const updateJobStatus = mutation({ ... }); // check admin role
   ```

5. **Migrate dashboard** (replaces `src/app/actions/dashboard.ts`)

   `convex/dashboard.ts`:

   ```typescript
   export const getDashboardData = query({ ... });
   // Aggregates job stats + user bookmark data
   ```

6. **Update all components** to use `useQuery`/`useMutation` from `convex/react`

   ```typescript
   // Before
   import { toggleBookmark } from "@/app/actions/bookmarks";
   await toggleBookmark(jobId);

   // After
   import { useMutation } from "convex/react";
   import { api } from "../../convex/_generated/api";
   const toggle = useMutation(api.bookmarks.toggleBookmark);
   await toggle({ jobId });
   ```

7. **Remove all `revalidatePath()` calls** -- Convex reactivity handles cache invalidation automatically

### Verification

- Profile page loads and updates user name
- Bookmark toggle works on job cards
- Bookmark status persists across page loads
- Dashboard shows correct aggregated data
- Admin panel shows pending jobs
- Admin can approve/reject jobs
- Job posting creates a pending job
- All data updates are reflected in real-time

---

## Phase 4: Cleanup & Remove Supabase

**Goal**: Remove all Supabase code, dependencies, and configuration.

**Duration**: ~2-3 hours (plus additional time for test rewrites)

### Steps

1. **Delete Supabase client files**
   - `src/lib/supabase/client.ts`
   - `src/lib/supabase/server.ts`
   - `src/lib/supabase/service.ts`

2. **Delete old server action files**
   - `src/app/actions/admin.ts`
   - `src/app/actions/bookmarks.ts`
   - `src/app/actions/dashboard.ts`
   - `src/app/actions/jobs.ts`
   - `src/app/actions/profile.ts`
   - `src/app/actions/search.ts`

3. **Delete old auth files**
   - `src/app/auth/actions.ts`
   - `src/app/auth/callback/route.ts`
   - `src/lib/auth/errorHandling.ts`
   - `src/lib/auth/errorRecovery.ts`

4. **Remove Supabase packages**

   ```bash
   npm uninstall @supabase/ssr @supabase/supabase-js
   ```

5. **Clean up environment variables**
   Remove from `.env.local` and deployment configs:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

6. **Rewrite tests**
   - All 196 tests mock Supabase clients -- update to mock Convex
   - Use `convex-test` package for testing Convex functions
   - Update component tests to use `ConvexProvider` mock

7. **Update documentation**
   - `CLAUDE.md` -- replace Supabase architecture with Convex architecture
   - `agents.md` -- update with Convex patterns
   - `docs/database.md` -- replace SQL schema with Convex schema reference
   - `docs/DEPLOYMENT.md` -- update deployment steps
   - `README.md` -- update setup guide

### Verification

- `npm run build` succeeds with no Supabase references
- `npm run lint` passes
- `npm run type-check` passes
- `npm test` passes (all tests updated)
- Full app functionality works end-to-end
- No Supabase imports remain in codebase

---

## New File Structure (Post-Migration)

```
convex/
  _generated/            # Auto-generated by Convex CLI
    api.d.ts
    dataModel.d.ts
    server.d.ts
  schema.ts              # Full schema definition
  auth.config.ts         # Convex Auth configuration
  auth.ts                # Auth hooks (profile creation on signup)
  jobs.ts                # Job queries and mutations
  tags.ts                # Tag queries
  bookmarks.ts           # Bookmark queries and mutations
  profiles.ts            # Profile queries and mutations
  admin.ts               # Admin queries and mutations
  dashboard.ts           # Dashboard aggregate queries
  users.ts               # Current user query

src/
  app/
    providers.tsx         # ConvexProvider with auth (new)
    layout.tsx            # Uses ConvexProvider
    # auth/ directory simplified (no callback route, no server actions)
  components/
    AuthModal.tsx         # Uses Convex Auth signIn/signUp
    Header.tsx            # Uses Convex Auth signOut
  hooks/
    useAuth.ts            # Uses useConvexAuth()
  # lib/supabase/ directory deleted entirely
```

---

## Key Tradeoffs

| Topic              | Supabase (Current)             | Convex (Target)                              |
| ------------------ | ------------------------------ | -------------------------------------------- |
| Database model     | Relational (PostgreSQL)        | Document-based with TypeScript schema        |
| Query language     | SQL via PostgREST              | TypeScript functions                         |
| Authorization      | RLS policies (database-level)  | Function-level checks (code)                 |
| Real-time          | Not used (available)           | Built-in for all queries                     |
| Auth               | Built-in (Supabase Auth)       | Convex Auth (native)                         |
| Cache invalidation | Manual `revalidatePath()`      | Automatic reactivity                         |
| Joins              | SQL joins + join tables        | Embedded arrays or manual lookups            |
| Type safety        | Partial (supabase-js types)    | End-to-end (schema -> queries -> components) |
| Vendor lock-in     | Moderate (PostgreSQL portable) | Higher (proprietary document DB)             |
| Self-hosting       | Possible                       | Not available                                |
| Raw SQL access     | Full PostgreSQL                | None                                         |
| Migrations         | SQL migration files            | Automatic schema evolution                   |

---

## Decision Log

| Decision               | Choice                                         | Rationale                                                                                                        |
| ---------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Auth provider          | Convex Auth                                    | Native integration, supports all current providers (Google, GitHub, email/password), no extra service dependency |
| Data migration         | Fresh start                                    | Simpler migration, no complex data export/import scripts, acceptable for current data volume                     |
| Migration strategy     | Incremental                                    | Lower risk, allows validation at each phase, Supabase runs in parallel as fallback                               |
| Tag storage            | Embedded in job document + separate tags table | Jobs have few tags (embed for read performance), separate table kept for autocomplete/listing                    |
| Join table elimination | `job_tags` removed                             | Convex document model favors embedding over joins for small arrays                                               |
