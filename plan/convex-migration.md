# Convex Migration Plan

Migration from Supabase (PostgreSQL + Auth) to Convex with Clerk.

**Status**: Phases 0-3 COMPLETE. Phase 4 (Cleanup) remaining.

---

## Completed Phases Summary

- **Phase 0**: Project setup, Convex initialization, schema defined ✅
- **Phase 1**: Public data migrated (jobs, tags, search) ✅
- **Phase 2**: Auth migrated to Clerk + Convex ✅
- **Phase 3**: Auth-dependent features migrated (bookmarks, profiles, admin, dashboard, job posting) ✅

---

## Phase 4: Cleanup & Final Tasks

**Goal**: Remove all Supabase code, seed initial data, and clean up.

### 4.1 Seed Tags Table

The `tags` table is empty (fresh start migration). Need to seed with common tech tags so users can select them when posting jobs.

**Create** `convex/seed.ts`:

```typescript
import { mutation } from "./_generated/server";

export const seedTags = mutation({
  args: {},
  handler: async (ctx) => {
    const defaultTags = [
      "JavaScript", "TypeScript", "React", "Vue", "Angular",
      "Node.js", "Python", "Java", "Go", "Rust", "C#", "PHP",
      "Ruby", "Swift", "Kotlin", "SQL", "NoSQL", "AWS", "Azure",
      "GCP", "Docker", "Kubernetes", "DevOps", "Full Stack",
      "Frontend", "Backend", "Mobile", "iOS", "Android",
      "Machine Learning", "AI"
    ];

    let created = 0;
    for (const name of defaultTags) {
      const existing = await ctx.db
        .query("tags")
        .withIndex("by_name", (q) => q.eq("name", name))
        .unique();

      if (!existing) {
        await ctx.db.insert("tags", { name });
        created++;
      }
    }

    return { created, total: defaultTags.length };
  },
});
```

**Run**: `npx convex run seed:seedTags`

### 4.2 Delete Supabase Client Files

- [ ] `src/lib/supabase/client.ts`
- [ ] `src/lib/supabase/server.ts`
- [ ] `src/lib/supabase/service.ts`

### 4.3 Delete Old Server Action Files (Dead Code)

These are no longer imported anywhere - components now use Convex directly:

- [ ] `src/app/actions/admin.ts`
- [ ] `src/app/actions/bookmarks.ts`
- [ ] `src/app/actions/dashboard.ts`
- [ ] `src/app/actions/jobs.ts`
- [ ] `src/app/actions/profile.ts`
- [ ] `src/app/actions/search.ts`

### 4.4 Delete Old Auth Files

- [ ] `src/app/auth/actions.ts`
- [ ] `src/app/auth/callback/route.ts`
- [ ] `src/lib/auth/errorHandling.ts`
- [ ] `src/lib/auth/errorRecovery.ts`

### 4.5 Remove Supabase Packages

```bash
npm uninstall @supabase/ssr @supabase/supabase-js
```

### 4.6 Clean Up Environment Variables

Remove from `.env.local` and deployment configs:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4.7 Update Tests

- All tests currently mock Supabase clients
- Update to mock Convex or use `convex-test` package
- Update component tests to use `ConvexProvider` mock

### 4.8 Update Documentation

- [ ] `CLAUDE.md` - Replace Supabase architecture with Convex
- [ ] `docs/database.md` - Replace SQL schema with Convex schema
- [ ] `docs/DEPLOYMENT.md` - Update deployment steps
- [ ] `README.md` - Update setup guide

---

## Verification Checklist

- [ ] `npx convex run seed:seedTags` succeeds
- [ ] PostJobModal shows tag buttons
- [ ] `npm run build` succeeds with no Supabase references
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] No Supabase imports remain in codebase
- [ ] Full app functionality works end-to-end

---

## Architecture Note: users vs profiles Tables

Both tables are necessary:

| Table | Managed By | Purpose |
|-------|------------|---------|
| `users` + `auth*` tables | Clerk (automatic) | Auth state: sessions, tokens, verification |
| `profiles` | Your app | App data: fullName, role (user/moderator/admin) |

The `profiles.userId` field links to Clerk user via `identity.subject`.
