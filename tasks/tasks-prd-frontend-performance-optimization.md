# Tasks: Frontend Performance & Data Fetching Optimization

## Relevant Files

- `package.json` - Add SWR dependency
- `src/app/layout.tsx` - Updated to wrap children with SWR provider
- `src/app/providers.tsx` - SWR configuration provider with default fetcher and caching settings
- `src/app/actions/search.ts` - Update/create server action for search with filtering
- `src/components/JobSearchWrapper.tsx` - Refactored to use SWR for server-side data fetching with dynamic keys
- `tests/components/JobSearchWrapper.test.tsx` - Comprehensive unit tests for refactored SWR-based component
- `src/app/dashboard/page.tsx` - Refactor to use SWR for dashboard data
- `src/app/dashboard/page.test.tsx` - Unit tests for dashboard page
- `src/components/PageWrapper.tsx` - Update to use lazy loading for PostJobModal
- `src/components/PageWrapper.test.tsx` - Unit tests for PageWrapper changes
- `src/app/page.tsx` - Update to work with new SWR-based architecture
- `src/app/page.test.tsx` - Unit tests for main page changes

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Setup SWR Integration and Configuration
  - [x] 1.1 Install SWR package: `npm install swr`
  - [x] 1.2 Create `src/app/providers.tsx` file with SWRConfig provider
  - [x] 1.3 Configure default fetcher function that works with server actions
  - [x] 1.4 Update `src/app/layout.tsx` to wrap children with the SWR provider
  - [x] 1.5 Test that SWR configuration is working by creating a simple test component

- [x] 2.0 Implement Server-Side Filtering Infrastructure
  - [x] 2.1 Update `src/app/actions/search.ts` to accept search query and tags parameters
  - [x] 2.2 Implement server-side filtering logic using Supabase queries
  - [x] 2.3 Ensure the server action returns properly formatted job data with tags
  - [x] 2.4 Add error handling for the server-side search function
  - [x] 2.5 Test the server action manually to ensure it returns expected results

- [x] 3.0 Refactor Job Search with SWR Data Fetching
  - [x] 3.1 Update `src/components/JobSearchWrapper.tsx` to use `useSWR` hook
  - [x] 3.2 Create dynamic SWR key based on search query and selected tags
  - [x] 3.3 Implement debounced search query state management
  - [x] 3.4 Update loading states to use SWR's `isLoading` and `isValidating` flags
  - [x] 3.5 Remove client-side filtering logic and use server-returned data directly
  - [x] 3.6 Ensure stale data remains visible while new data is being fetched
  - [x] 3.7 Write unit tests for the refactored JobSearchWrapper component

- [x] 4.0 Optimize Dashboard Page Performance
  - [x] 4.1 Analyze current dashboard data fetching in `src/app/dashboard/page.tsx`
  - [x] 4.2 Create or update server action for dashboard data fetching
  - [x] 4.3 Refactor dashboard page to use `useSWR` for data fetching
  - [x] 4.4 Implement SWR caching strategy for dashboard data
  - [x] 4.5 Test navigation between homepage and dashboard for improved performance
  - [x] 4.6 Write unit tests for the dashboard page changes

- [ ] 5.0 Implement Performance Enhancements and Lazy Loading
  - [ ] 5.1 Update `src/components/PageWrapper.tsx` to use `dynamic()` import for PostJobModal
  - [ ] 5.2 Implement lazy loading for PostJobModal component
  - [ ] 5.3 Update `src/app/page.tsx` to work efficiently with the new SWR-based architecture
  - [ ] 5.4 Measure and document bundle size improvements
  - [ ] 5.5 Test Core Web Vitals (LCP, FID) before and after optimizations
  - [ ] 5.6 Write unit tests for all updated components 