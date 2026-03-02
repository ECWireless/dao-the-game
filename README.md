# DAO the Game

`DAO the Game` is a mobile-first, off-chain simulation built as a Vite + React + TypeScript prototype.

The current build is a guided vertical slice: the player moves through a fake phone UI, receives a mis-sent client email, bluffs as a studio, and starts building an autonomous org.

## Stack

- Vite
- React 18
- TypeScript
- Zustand
- Vitest
- ESLint

## Getting Started

```bash
pnpm install
pnpm dev
```

Then open the local Vite URL in your browser.

## Scripts

- `pnpm dev` - start the development server
- `pnpm build` - typecheck and build for production
- `pnpm preview` - preview the production build
- `pnpm lint` - run ESLint
- `pnpm typecheck` - run TypeScript checks
- `pnpm test` - run the test suite

## Project Structure

```text
src/
  sim/       pure simulation logic
  state/     Zustand game state
  levels/    story and tutorial configuration
  theme/     global tokens and styling
  ui/        app screens and components
  types.ts   shared types

dev-history/ dated build journal
```

## Notes

- This is a proof-of-concept, not a production app.
- Everything is simulated. There is no backend, no real wallet flow, and no on-chain integration.
- Progress is stored locally in browser storage for the current demo flow.
