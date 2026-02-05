# FirstDevJob

A job board for developers seeking their first role in tech.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **Convex** - Backend database with real-time sync
- **Clerk** - Authentication (email, Google, GitHub)
- **Tailwind CSS 4** - Styling
- **TypeScript** - Type safety

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- [Convex account](https://convex.dev)
- [Clerk account](https://clerk.com)

### Setup

```bash
# Clone and install
git clone https://github.com/yourusername/firstdevjob.git
cd firstdevjob
bun install

# Set up Convex
bunx convex dev

# In another terminal, run Next.js
bun run dev
```

### Environment Variables

Create `.env.local`:

```env
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

### Seed Initial Data

```bash
bunx convex run seed:seedTags
```

## Features

- Job search with tag filtering
- Application tracking dashboard
- Job posting with admin approval
- Role-based access (user, moderator, admin)

## Project Structure

```
├── convex/           # Backend (schema, queries, mutations)
├── src/
│   ├── app/          # Next.js pages
│   ├── components/   # React components
│   └── lib/          # Utilities
└── tests/            # Test files
```

## Scripts

```bash
bun run dev        # Development server
bun run build      # Production build
bun run lint       # Lint code
bun run test       # Run tests
```

## Documentation

Full documentation is available at [/docs](https://firstdevjob.com/docs) covering:

- **User Guide** - Getting started, browsing jobs, posting jobs, tracking applications
- **Architecture** - System overview, tech stack, data flow, authentication
- **Technical** - Database schema, deployment, contributing guidelines
- **API Reference** - Jobs, bookmarks, profiles, and admin APIs

To run the docs locally, start the dev server (`bun run dev`) and visit `http://localhost:3000/docs`.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run `bun run lint` and `bun run test`
5. Open a PR

## License

MIT
