# DAO the Game

`DAO the Game` is a tycoon, management simulation game that begins with a contract request email being accidentally sent to the player. The player is tasked with building a site and faking a full studio to complete the contract.

In the full game, the player would be allowed 3 types of focuses: building workers, building organizational units, or taking on other DAOs in the multi-player arena. While this current version is only a demo for now, one can imagine having the freedom to build out their organizations with more and more complexity in order to produce more and more elaborate creations for customers. They could also license workers to other organizations, sell off some of their organizational units, or buy out entire other DAOs.

## Stack

- Vite
- React 18
- TypeScript
- Vercel Functions
- Neon Postgres
- Privy
- TanStack Query
- Zustand
- Vitest
- ESLint

## Getting Started

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm dev:all
```

Then open the local Vite URL in your browser.

Required env vars:

- `VITE_PRIVY_APP_ID`
- `PRIVY_APP_SECRET`
- `DATABASE_URL`

Optional env vars:

- `VITE_API_BASE_URL`
- `VITE_SEPOLIA_RPC_URL`
- `VITE_PREFER_SMART_WALLET_EXECUTION`

`pnpm dev:all` runs:

- the Vite frontend on `http://localhost:5173`
- the local Vercel Functions server on `http://localhost:3000`

The Vite dev server proxies `/api/*` requests to `localhost:3000`, which matches the same-origin `/api` routing used in production on Vercel.

## Scripts

- `pnpm dev` - start the Vite frontend on `localhost:5173`
- `pnpm dev:api` - start local Vercel Functions on `localhost:3000`
- `pnpm dev:all` - run the frontend and API servers together
- `pnpm db:migrate` - create or update the Neon schema before running the app
- `pnpm build` - typecheck and build for production
- `pnpm preview` - preview the production build
- `pnpm reset:all` - wipe local app data in Neon after confirmation
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
- The app now includes a small Vercel-backed API layer for player bootstrap, progress tracking, saved run state, and reset flows.
- Privy handles authentication, identity tokens, and wallet provisioning for the current demo.
- `VITE_PREFER_SMART_WALLET_EXECUTION=true` opts new org creation into smart-wallet execution. Leave it off until your Privy smart-account paymaster path is configured and ready.
- Progress is stored in Neon and mirrored locally in browser storage for fast client restoration.
- Run `pnpm db:migrate` any time you point the app at a fresh database. Request handlers no longer create tables or indexes on demand.
