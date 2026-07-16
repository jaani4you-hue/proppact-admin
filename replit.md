# PropPact Admin

A property management admin panel built with React + Vite, Firebase Auth, Firestore, and Firebase Storage.

## Run & Operate

- **Frontend (active):** `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/prop-pact-admin run dev` — React + Vite admin UI on port 5173 (configured as the "PropPact Admin" workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required secrets: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- The Express API server (`artifacts/api-server`) and PostgreSQL/DATABASE_URL are **not in use** — this project uses Firebase exclusively.

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React 19 + Vite 7, Tailwind CSS v4, shadcn/ui (Radix primitives)
- Auth / DB / Storage: Firebase (Authentication, Firestore, Storage)
- Routing: react-router-dom v7
- Data fetching: TanStack React Query
- Build: Vite (dev + static production build)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
