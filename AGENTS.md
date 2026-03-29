# AGENTS.md

This file applies to the whole repository.

## Project Summary

`DAO the Game` is a narrative management-sim demo about accidentally taking on a client contract, assembling a fake studio, assigning contractors, and shipping a conference site through a worker pipeline.

This is not a generic CRUD app. Product decisions should preserve:

- clear worker identity and role contrast
- strong game-world fiction
- readable, mobile-first phone UI
- honest failure states
- minimal leakage of internal AI/build-pipeline language into player-facing copy

## Stack

- Vite
- React 18
- TypeScript
- Zustand
- TanStack Query
- Vercel Functions
- Neon Postgres
- Privy
- Hats Protocol / viem
- OpenAI API
- Vitest
- ESLint

## Working Agreement

- Use `pnpm`, not `npm`.
- Prefer small, surgical edits over broad rewrites.
- Do not revert unrelated user changes in a dirty worktree.
- If a change affects the game fiction or player-facing terminology, preserve the in-world framing.
- If a change affects the artifact pipeline, preserve honest failure behavior. Do not reintroduce silent fallback pages that pretend broken worker output succeeded.

## Key Commands

```bash
pnpm dev
pnpm dev:api
pnpm dev:all
pnpm db:migrate
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Use targeted verification when possible, but run broader checks for cross-cutting changes.

## Environment Notes

Required env vars:

- `VITE_PRIVY_APP_ID`
- `PRIVY_APP_SECRET`
- `DATABASE_URL`

Common optional env vars:

- `VITE_API_BASE_URL`
- `VITE_HATS_CHAIN`
- `VITE_PREFER_SMART_WALLET_EXECUTION`
- `PINATA_JWT`
- `PINATA_GATEWAY_BASE_URL`
- `OPENAI_API_KEY`
- `ARTIFACT_DEBUG_WORKERS`
- `VITE_ARTIFACT_DEBUG_WORKERS`

Chain behavior:

- local/dev defaults to `Sepolia`
- production defaults to `Base`
- `VITE_HATS_CHAIN=sepolia|base` can override

Do not remove `chainId` from persisted org/tree data. The app is chain-aware.

## Repo Map

### Frontend

- `src/App.tsx`
  - app runtime, auth/bootstrap flow, artifact deployment orchestration
- `src/ui/`
  - phone shell, app scenes, Factory, RaidGuild, Whiteboard, Mail, Messages
- `src/state/`
  - Zustand store, progression state, persistence helpers
- `src/sim/`
  - simulation logic for runs, scoring, deployment evaluation
- `src/artifacts/`
  - artifact assembly helpers and deterministic artifact utilities
- `src/levels/`
  - tutorial/story configuration
- `src/lib/`
  - API client helpers, Hats integration, chain config

### Backend

- `api/_lib/`
  - shared server helpers, DB, env, OpenAI artifact generation, Pinata integration
- `api/artifact/deploy.ts`
  - streaming artifact deploy route
- `api/player/bootstrap.ts`
  - player bootstrap
- `api/game-state.ts`
  - state persistence
- `api/progress.ts`
  - progress tracking
- `api/org/tree.ts`
  - org tree persistence
- `api/org/role.ts`
  - org role persistence

### Project History

- `dev-history/`
  - dated build logs and sprint notes

## Current Product Rules

### Factory

- The app is called `Factory`, not `Machine`.
- Factory should feel like an inspectable assembly line, not a generic deploy dashboard.
- Completed nodes are clickable and should stay informative.
- The final output preview must remain closable so users can get back to the full assembly.
- Recovery/retry flows should reset the Factory presentation coherently.

### Worker Roster

The active roster is currently six workers:

1. Rune Mercer
2. Dorian Ash
3. Kestrel Vale
4. Hexa Thorn
5. Sable Quill
6. Mint Halberd

They are intentionally legible PM-style choices, not vague flavor characters. Preserve that clarity.

### Artifact Pipeline

Current intended responsibilities:

- `design`
  - returns structured design direction/contract
- `implementation`
  - writes the full HTML document
- `review`
  - judge-only pass, no HTML rewrite
- `deployment`
  - lightweight launch/publish handoff

Important:

- `implementation` is currently the only HTML-writing stage
- `review` is intentionally judge-only for speed and stability
- if you change that, expect latency and reliability tradeoffs

### Player-Facing Language

Avoid leaking internal language like:

- “AI generation”
- “build pipeline”
- “model output”

Prefer in-world language like:

- assembly
- worker line
- handoff
- launch
- deploy

### Preview Safety

- Generated HTML preview must remain sandboxed.
- Do not reintroduce unsandboxed `srcDoc` behavior for worker-authored HTML.

## Code Conventions

- Keep TypeScript types explicit around contracts, persisted state, and worker traces.
- Prefer shared helpers over repeating business logic in scene components.
- Keep UI text concise and game-world-consistent.
- For player-facing worker UI, avoid clutter. Surface the useful layer, not every internal field.
- Do not add backward-compatibility shims unless there is a real migration need. This repo is still pre-launch and can prefer clean resets over legacy baggage.

## Verification Expectations

At minimum, run:

```bash
pnpm typecheck
pnpm lint
```

Also run when relevant:

```bash
pnpm test
pnpm build
```

For focused changes, run the smallest relevant test file(s) in addition to the broad checks above.

## Documentation Expectations

- Add or update `dev-history` notes for meaningful day/sprint milestones.
- Keep `README.md` accurate when changing setup, env vars, or major architecture.
- If a workflow or product rule becomes important enough that future contributors should not accidentally break it, document it here.
