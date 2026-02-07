# Docs updates plan

- [x] Review current @docs implementation (source loader, layout, globals, MDX rendering) and note any mermaid usage.
- [x] Remove mermaid diagrams if present in docs content (or confirm none exist and note any remaining references).
- [x] Add docs navbar theme switcher and GitHub icon link (ensure URL is correct).
- [x] Fix code block contrast for dark/light modes (Shiki + data-theme overrides).
- [x] Verify changes (run lint) and note results.

## Review

- `bun run lint` reports an existing warning: `src/components/JobCard.tsx` unused `router`.

# Docs CSS navigation fix

- [ ] Identify docs CSS that leaks into home after route change.
- [ ] Scope/layer Fumadocs styles so home header stays correct.
- [ ] Verify by navigating /docs -> / (no refresh) and note result.
- [ ] Run `bun run lint` and note results.
