# Lessons

## Validation workflow
- After implementation, always run `bun run lint` and `bun run test` before reporting completion.
- If tests fail due watchman environment issues, rerun with `bun run test -- --watchman=false` to get a reliable signal.
- Resolve lint warnings immediately (for example, remove unused imports/variables) so the repo stays clean.
