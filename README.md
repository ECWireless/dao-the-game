# DAO the Game

`DAO the Game` is a tycoon, management simulation game that begins with a contract request email being accidentally sent to the player. The player is tasked with building a site and faking a full studio to complete the contract.

In the full game, the player would be allowed 3 types of focuses: building workers, building organizational units, or taking on other DAOs in the multi-player arena. While this current version is only a demo for now, one can imagine having the freedom to build out their organizations with more and more complexity in order to produce more and more elaborate creations for customers. They could also license workers to other organizations, sell off some of their organizational units, or buy out entire other DAOs.

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
