# ZainStore.pk — Claude Code Instructions

## Project Overview

ZainStore.pk is a **multi-vendor marketplace dashboard** for the Pakistani e-commerce market (comparable to Daraz Seller Center / Amazon Seller Central). It is a **dashboard-only system** — no public storefront is in scope. The platform has three user types with completely separate dashboard portals.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 14.2.35 |
| Language | TypeScript | 5.7 |
| Styling | Tailwind CSS v4 | 4.x (CSS-first config via `@theme`) |
| Database | PostgreSQL 16 via Docker | `docker-compose.yml` |
| ORM | Prisma | 6.x |
| Auth | NextAuth.js (v4) | 4.x |
| Server State | TanStack React Query | v5 (configured, not yet wired to data) |
| Client State | Zustand | v5 (sidebar store — currently unused) |
| Charts | Recharts | 3.x |
| Forms | Native React state + `useTransition` | — |
| Toasts | Sonner | 2.x |
| Icons | Lucide React | 0.468 |
| Validation | Zod v4 | 4.x (use `.issues`, not `.errors`) |

## Running the Project

```bash
# Prerequisites: Node >= 20.9.0, Docker running
npm install
npx prisma generate        # required after fresh clone
docker compose up -d db    # start postgres
npx prisma db push         # create tables
npm run db:seed            # seed demo users
npm run dev                # http://localhost:3000
```

**Demo credentials** (seeded by `npm run db:seed`):
- Admin: `admin@zainstore.local` / `zainstore123`
- Vendor 1: `seller-one@zainstore.local` / `zainstore123` (Urban Loom)
- Vendor 2: `seller-two@zainstore.local` / `zainstore123` (Gadget Yard)
- Customer: `customer@zainstore.local` / `zainstore123`

## Architecture

### Route Groups

```
src/app/
├── (auth)/          → Public auth pages, no layout
│   ├── login/
│   ├── register/customer/
│   ├── register/vendor/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── verify-email/
│   └── confirm-email/
├── (dashboard)/     → Protected portal pages, DashboardShell layout
│   ├── admin/       → SUPER_ADMIN portal (15 pages + profile)
│   ├── vendor/      → VENDOR portal (8 pages + profile)
│   └── customer/    → CUSTOMER portal (7 pages + profile)
├── api/
│   ├── auth/[...nextauth]/   → NextAuth handler
│   ├── products/             → GET + POST products
│   └── health/               → DB ping
└── page.tsx         → Smart redirect by role → /admin | /vendor | /customer
```

### Server / Client Component Boundary Rule

**CRITICAL**: Never pass React component references (e.g., Lucide icons) as props across the Server→Client boundary. Icons must be imported inside the Client Component, not passed from a Server Component. This was a breaking bug that was fixed — do not reintroduce it.

Correct pattern:
```tsx
// ✅ Sidebar is "use client", imports its own nav items by portal name
<Sidebar portal="admin" title="Super Admin" />

// ❌ Never do this — passes icon functions from server to client
<Sidebar items={adminNavigation} />
```

### Data Fetching Pattern

- **Server Components**: Call `getServerSession()` + `db.*` directly for initial page data
- **Server Actions** (`"use server"`): All mutations (forms, updates)
- **React Query**: Configured but not yet used — use for future client-side polling/refetch
- **API Routes**: Use for external integrations only; internal pages use Server Actions

### Authentication Flow

```
Request → middleware.ts (withAuth) → /login if no JWT
Login → /api/auth/[...nextauth] → JWT with { id, name, email, role }
JWT callbacks → session.user.{ id, role }
Role redirect → page.tsx → dashboardHomeFor(role)
```

Token types in `VerificationToken.identifier`:
- `verify:{email}` — email verification (24h)
- `reset:{email}` — password reset (1h)
- `email-change:{userId}:{newEmail}` — email change confirmation (24h)

## User Roles & Access

| Role | Portal | Can Register? | Requires Approval? |
|---|---|---|---|
| `SUPER_ADMIN` | `/admin/*` | No (seeded only) | No |
| `VENDOR` | `/vendor/*` | Yes (`/register/vendor`) | Yes — admin must approve |
| `CUSTOMER` | `/customer/*` | Yes (`/register/customer`) | No |

Middleware (`src/middleware.ts`) protects `/admin/*`, `/vendor/*`, `/customer/*`. It does **not** enforce cross-role isolation (a vendor who knows the URL can visit `/admin/*`). Role-level guards should be added inside each layout or page when hardening for production.

## Brand Theme

Defined via Tailwind v4 `@theme` in `src/app/globals.css`:

| Token | Value | Use |
|---|---|---|
| `brand-500` | `#faa42d` | Primary buttons, active nav, links |
| `brand-600` | `#e8920a` | Hover states |
| `brand-50` | `#fff8e8` | Soft icon backgrounds |
| `accent-500` | `#f1672e` | Badges, notification dot, highlights |
| `accent-50` | `#fff2ed` | Soft accent backgrounds |

Always use `brand-*` and `accent-*` classes. Never use `teal-*` — those have been fully replaced.

## Coding Standards

### File Naming
- Pages: `page.tsx` (Next.js convention)
- Components: `kebab-case.tsx` in `src/components/{category}/`
- Server actions: `actions.ts` in `src/lib/{feature}/`
- Utilities: `utils.ts`, `format.ts`, `tokens.ts`

### Component Conventions
```tsx
// Server Component (default — no directive needed)
export default async function MyPage() { ... }

// Client Component (explicit directive required)
"use client";
export function MyComponent() { ... }

// Server Action (explicit directive required)
"use server";
export async function myAction() { ... }
```

### Action Result Type
All server actions must return this discriminated union:
```ts
type ActionResult = { success: true; message: string } | { success: false; error: string };
```

### Zod Version
This project uses **Zod v4**. Use `.issues`, not `.errors`:
```ts
// ✅ Correct
parsed.error.issues[0].message

// ❌ Wrong (Zod v3 API)
parsed.error.errors[0].message
```

### Icon Types
Always type icon props as `LucideIcon`, not `ComponentType<{...}>`:
```ts
import type { LucideIcon } from "lucide-react";
type Props = { icon: LucideIcon };
```

### Suspense for useSearchParams
Any Client Component using `useSearchParams()` must be wrapped in `<Suspense>`:
```tsx
export default function Page() {
  return <Suspense><Inner /></Suspense>;
}
function Inner() {
  const params = useSearchParams(); // inside Suspense
}
```

### Form Pattern
Forms use plain React state + `useTransition` + Server Actions. `react-hook-form` is installed but not yet in use — adopt it for complex forms going forward.

### Currency
Always format currency as PKR using `src/lib/format.ts`:
```ts
import { formatCurrency } from "@/lib/format";
formatCurrency(8499); // → "PKR 8,499"
```

## Current Implementation Status

### ✅ Fully Implemented
- Auth system (login, register, forgot/reset password, email verification)
- Profile management (all 3 roles, change password, email change, vendor bank/store, customer address)
- Header profile dropdown (avatar, role badge, links, sign out)
- Three portal layouts with active sidebar navigation
- Brand theme (amber + orange-red)
- DB schema (44 models, fully seeded)

### 🔶 Scaffolded (static data, no real backend)
- All 30 dashboard content pages use `ModulePage` / `ModuleTable` with hardcoded strings
- Admin overview stats use `adminStats` from `sample-data.ts`
- Vendor/customer overview pages use hardcoded rows

### ❌ Not Started
- Real CRUD for all business entities (vendors, products, orders, refunds, etc.)
- Mobile sidebar (hamburger + drawer)
- File/image upload (currently uses URL inputs)
- Email provider (logs to terminal in dev)
- Dark mode toggle (CSS vars exist, no toggle)
- Rate limiting on auth endpoints
- Role-level cross-portal protection in middleware
