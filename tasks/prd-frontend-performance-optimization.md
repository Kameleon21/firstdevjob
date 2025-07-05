# PRD: Frontend Performance & Data Fetching Optimization

## 1. Introduction/Overview
This document outlines the requirements for improving the perceived and actual load speeds of the frontend application. The primary focus is to optimize how the application fetches, caches, and displays data by integrating the SWR data-fetching library. This initiative will target the main job board's search/filter functionality and the user dashboard page to create a smoother, faster, and more scalable user experience without requiring backend changes.

## 2. Goals
- **Improve Perceived Performance:** Reduce noticeable delays when users search, filter, or navigate between pages.
- **Reduce Load Times:** Decrease the initial load time for data-heavy pages like the homepage and dashboard.
- **Optimize Network Requests:** Minimize redundant data fetching with smart client-side caching.
- **Increase Scalability:** Move from client-side filtering of a large dataset to efficient server-side filtering that scales with the number of jobs.

## 3. User Stories
- As a job seeker, I want the jobs list to load quickly so I can start my search without waiting.
- As a job seeker, when I type a search query or select a filter tag, I want to see updated results quickly without the page feeling stuck.
- As a user, when I navigate to my dashboard, I want it to load almost instantly so I can view my information without a jarring delay.
- As a user, when I switch between the main job board and my dashboard, I want the transition to be smooth and immediate, leveraging cached data.

## 4. Functional Requirements
1.  **Integrate SWR:** Add the `swr` package as a project dependency.
2.  **Refactor Job Search:**
    -   The `JobSearchWrapper` component shall be refactored to use the `useSWR` hook to fetch job data.
    -   The hook's query key must dynamically change based on the user's search query and selected tags.
    -   User input from the search bar will be debounced before triggering a new data fetch.
3.  **Implement Server-Side Filtering:**
    -   A new or existing server action (e.g., in `src/app/actions/search.ts`) must be updated to accept search and tag parameters.
    -   This action will perform the filtering logic on the server/database level and return only the relevant results.
4.  **Optimize Dashboard Page:**
    -   The `/dashboard` page shall be refactored to use the `useSWR` hook for fetching its specific data.
    -   SWR's caching should be leveraged to make navigating to and from the dashboard feel instant.
5.  **Loading State UI:**
    -   While `useSWR` is refetching data (revalidating), a subtle loading indicator (similar to the current spinner) will be displayed.
    -   The currently displayed (stale) data will remain visible until the new data has been successfully fetched.
6.  **Lazy Loading:**
    -   The `PostJobModal` component should be loaded dynamically (lazily) to reduce the initial JavaScript bundle size of the main page.

## 5. Non-Goals (Out of Scope)
-   Any changes to the backend infrastructure, database schema, or Supabase queries beyond what is needed for server-side filtering.
-   A major redesign of the UI. The focus is on performance, not aesthetics.
-   Implementation of infinite scrolling or pagination for the job list (this can be a future enhancement).
-   Optimizations for unmentioned pages like the Admin section or user profiles (unless the profile is the dashboard).

## 6. Design Considerations
-   The existing "Searching..." spinner is approved for use as the subtle loading indicator.
-   No full-page skeleton loaders are required for the job list view during revalidation. A skeleton loader could be considered for the dashboard's initial load if it significantly improves perceived performance.

## 7. Technical Considerations
-   A global `SWRConfig` provider should be set up in `layout.tsx` or a new `providers.tsx` file to define a default fetcher function that utilizes server actions.
-   Use Next.js's `dynamic()` function for implementing lazy loading on the `PostJobModal`.
-   The Supabase RLS policies should be reviewed to ensure they are compatible and performant with the new server-side search and filter queries.

## 8. Success Metrics
-   **Core Web Vitals:** A measurable improvement in Largest Contentful Paint (LCP) and First Input Delay (FID) on the homepage and dashboard, checked using browser developer tools or Vercel Analytics.
-   **Reduced Bundle Size:** A noticeable decrease in the initial client-side JavaScript bundle size for the homepage.
-   **User-Perceived Latency:** Faster, sub-second response times for search and filter operations.

## 9. Open Questions
-   Should we add pagination from the start using `useSWRInfinite`, or is the current "load all filtered" approach sufficient for the expected number of jobs? For this PRD, we assume no pagination. 