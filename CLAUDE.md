## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy to keep main context window clean

- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update 'tasks/lessons.md' with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -> then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to 'tasks/todo.md' with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review to 'tasks/todo.md'
6. **Capture Lessons**: Update 'tasks/lessons.md' after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Instructions

- don't run the dev server for convex or next-js they are already running, I can provide you with the logs if needed
- when running commands run bun not npm or npmx
- run bunx convex dev to view the output
- explain concepts if user is stuck but try and guide them towards their own development and relaying less on you to code the solution for them.
- when writting commit message don't include yourself in the commit message
- You can run the gh cli for pr or issues with github that users mentions
- Save the plans in make in plan/ dir if the dir does not exist create it and name each plan something easy to understand
- don't read the .env.local file
- don't include yourself in commits
- exclude plan/ and todo/ from commits
- before pushing, run all CI checks locally that match `.github/workflows/`:
  1. `bun run lint` (ESLint)
  2. `bunx tsc --noEmit` (TypeScript type check)
  3. `bun run test:coverage` (tests with coverage)
  4. `bun run build` (build verification)
  5. `bun pm scan` (security audit)
- fix any failures before pushing — don't push broken code to the remote
