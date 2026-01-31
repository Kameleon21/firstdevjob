# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Instructions

- don't run the dev server for convex or next-js they are already running, I can provide you with the logs if needed
- when running commands run bun not npm or npmx
- run bunx convex dev to view the output

```

## Development Workflow

1. **Environment Setup**: Copy `.env.local` from README, add Supabase credentials
2. **Database Setup**: Run SQL from `docs/database.md` in Supabase dashboard
3. **First Admin**: Sign up, then manually set role to 'admin' in profiles table via SQL
4. **Pre-commit**: Run `npm run lint` and `npm run type-check`
5. **Before PR**: Ensure `npm run build` succeeds and tests pass

## Key Documentation

- `docs/database.md` - Complete database schema and RLS policies
- `docs/DEPLOYMENT.md` - Deployment steps and security checklists
- `README.md` - Full setup guide and project overview
```
