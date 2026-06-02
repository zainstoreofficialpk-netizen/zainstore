# ZainStore.pk — Agent & Developer Guidelines

## Development Workflow

### Before Starting Any Task
1. Read `CLAUDE.md` for project overview and critical rules
2. Read `PROJECT_CONTEXT.md` for current status and known issues
3. Run `git status` to confirm working tree state
4. Verify dev server is running: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login`

### Workflow for Every Change
```
1. Read affected files before editing
2. Make changes
3. Run: npx next build 2>&1 | tail -10   (catch type errors before committing)
4. Restart dev server if .next cache issues: pkill -f "next dev" && rm -rf .next && npm run dev
5. Verify in browser
6. git add -A && git commit (conventional message)
7. git push origin develop
```

### Database Changes
- **Never** run `prisma db push --force-reset` without explicit user consent
- For schema changes in development: `npx prisma db push` (safe, non-destructive)
- After schema changes: `npx prisma generate` (regenerates client)
- After force-reset: always run `npm run db:seed` to restore demo data

---

## Coding Guidelines

### Server vs Client Components

**Default: Server Component** (no directive). Add `"use client"` only when you need:
- React hooks (`useState`, `useEffect`, `useRef`, `useTransition`, etc.)
- Browser APIs
- Event handlers as component-level logic

**Pattern for forms** (most common):
```tsx
// page.tsx — Server Component fetches initial data
export default async function MyPage() {
  const session = await getServerSession(authOptions);
  const data = await db.someModel.findMany({ where: { userId: session.user.id } });
  return <MyForm initialData={data} />;
}

// my-form.tsx — Client Component handles state + calls server action
"use client";
import { myServerAction } from "@/lib/feature/actions";

export function MyForm({ initialData }) {
  const [isPending, startTransition] = useTransition();
  function handleSubmit(e) {
    e.preventDefault();
    startTransition(async () => {
      const result = await myServerAction(formData);
      if (result.success) toast.success(result.message);
      else toast.error(result.error);
    });
  }
}
```

### Server Actions Pattern

Every server action file must start with `"use server"` and return `ActionResult`:

```ts
"use server";

type ActionResult = { success: true; message: string } | { success: false; error: string };

export async function myAction(data: MyData): Promise<ActionResult> {
  // 1. Validate input (Zod)
  // 2. Authenticate (requireUser() or getServerSession())
  // 3. Authorize (check role/ownership)
  // 4. Mutate DB
  // 5. Return ActionResult
}
```

**Authentication in server actions** — always call `requireUser()` at the top:
```ts
async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}
```

### Validation with Zod v4

This project uses **Zod v4**. Critical difference from v3:

```ts
// ✅ Zod v4 (this project)
parsed.error.issues[0].message

// ❌ Zod v3 (wrong, will throw)
parsed.error.errors[0].message
```

Always define schemas outside of functions:
```ts
const schema = z.object({ ... }); // module-level, not inside action

export async function myAction(data: z.infer<typeof schema>): Promise<ActionResult> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  // ...
}
```

### Database Access

Use the singleton from `src/lib/db.ts`:
```ts
import { db } from "@/lib/db";

// In server components
const users = await db.user.findMany({ ... });

// Always include only the fields you need (select)
const user = await db.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true, role: true },
});
```

**Ownership checks** — always scope queries to the authenticated user:
```ts
// ✅ Correct — vendor can only see their own withdrawals
await db.withdrawal.findMany({ where: { vendorId: vendor.id } });

// ❌ Wrong — no scoping
await db.withdrawal.findMany();
```

---

## Component Patterns

### New UI Primitive Component
Place in `src/components/ui/`. Follow the existing pattern:

```tsx
// src/components/ui/my-component.tsx
import { cn } from "@/lib/utils";

type Props = {
  // ...
  className?: string;
};

export function MyComponent({ className, ...props }: Props) {
  return (
    <div className={cn("base-classes", className)} {...props} />
  );
}
```

### New Dashboard Feature Component
Place in `src/components/dashboard/` (layout-related) or `src/components/{feature}/` (domain-specific):

```tsx
// Feature components that only render inside dashboard
// src/components/vendors/vendor-table.tsx
```

### Color Usage Rules

| Scenario | Class to use |
|---|---|
| Primary button, active state, CTA | `bg-brand-500 hover:bg-brand-600` |
| Links, icon labels | `text-brand-600` |
| Soft icon backgrounds | `bg-brand-50 text-brand-600` |
| Active nav item | `bg-brand-50 text-brand-700` |
| Accent badge, notification dot | `bg-accent-500`, `text-accent-600` |
| Success | `bg-emerald-50 text-emerald-700` |
| Warning / pending | `bg-amber-50 text-amber-700` |
| Danger / error | `bg-rose-50 text-rose-700` |
| Muted | `bg-zinc-100 text-zinc-700` |

**Never** use `teal-*` — it has been fully replaced with `brand-*`.

### Badge Tone Map

```tsx
import { Badge } from "@/components/ui/badge";

// Available tones: default | accent | success | warning | danger | muted
<Badge tone="success">Active</Badge>
<Badge tone="warning">Pending</Badge>
<Badge tone="danger">Rejected</Badge>
<Badge tone="accent">Withdrawal</Badge>
<Badge tone="muted">Draft</Badge>
```

Status → tone mapping used in `module-table.tsx`:
- active / paid / approved → `success`
- pending / review → `warning`
- rejected / failed / suspended → `danger`
- everything else → `muted`

### Avatar Usage

```tsx
import { Avatar } from "@/components/ui/avatar";

// Sizes: xs | sm | md | lg | xl
<Avatar name="Ayesha Khan" image={user.image} size="md" />
// Falls back to initials with deterministic gradient if no image
```

---

## State Management Rules

### Server State (data from DB)
- Fetch in **Server Components** using `db.*` directly
- For client-side refresh/polling: use **TanStack React Query** (configured in `QueryProvider`, not yet used — adopt for new features that need live updates)

### Client UI State
- Simple component state: `useState`
- Async mutations with loading state: `useTransition` + Server Action
- Cross-component dashboard state (sidebar, etc.): **Zustand** via `useDashboardStore`
  - Note: the store is currently defined but not used. When implementing mobile sidebar, consume `useDashboardStore` in Sidebar + Topbar.

### Toast Notifications
Always use Sonner (already in root layout):
```ts
import { toast } from "sonner";

toast.success("Saved!");
toast.error("Something went wrong.");
toast.loading("Saving…");
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Page files | `page.tsx` | `admin/vendors/page.tsx` |
| Layout files | `layout.tsx` | `admin/layout.tsx` |
| Component files | `kebab-case.tsx` | `vendor-table.tsx` |
| Server action files | `actions.ts` | `lib/vendors/actions.ts` |
| Utility files | descriptive | `lib/format.ts`, `lib/utils.ts` |
| Type files | descriptive | `types/next-auth.d.ts` |
| Variables | `camelCase` | `vendorProfile`, `storeSlug` |
| Types / Interfaces | `PascalCase` | `ProfileData`, `ActionResult` |
| DB model keys | `camelCase` (Prisma convention) | `userId`, `createdAt` |
| Tailwind classes | Utility-first | `bg-brand-500 text-white` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `NEXTAUTH_SECRET` |
| Route params | `kebab-case` | `/admin/vendor-details` |

---

## Adding New Module Pages

When building a real module page (replacing a `ModulePage` scaffold):

1. **Create the server component page** that fetches data:
```tsx
// src/app/(dashboard)/admin/vendors/page.tsx
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { VendorTable } from "@/components/vendors/vendor-table";

export default async function VendorsPage() {
  const vendors = await db.vendorProfile.findMany({
    include: { user: true, store: true },
    orderBy: { createdAt: "desc" },
  });
  return <VendorTable initialVendors={vendors} />;
}
```

2. **Create the client component** for interactive UI:
```tsx
// src/components/vendors/vendor-table.tsx
"use client";
// DataTable, filters, row actions, modals
```

3. **Create server actions** in `src/lib/vendors/actions.ts`

4. **Remove the old `ModulePage` import** from the page

---

## Adding New API Routes

All new API routes should:
1. Authenticate with `getServerSession(authOptions)`
2. Authorize by role
3. Validate input with Zod
4. Return typed JSON responses

```ts
// src/app/api/vendors/[id]/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // ...
}
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Generate a strong `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- [ ] Set `NEXTAUTH_URL` to the production URL
- [ ] Set `NEXT_PUBLIC_APP_URL` to the production URL
- [ ] Set `DATABASE_URL` to a production Postgres connection string
- [ ] Wire up a real email provider in `src/lib/email.ts` (Resend recommended)
- [ ] Add authentication guard to `POST /api/products`
- [ ] Add cross-role protection to middleware (vendor cannot visit `/admin/*`)
- [ ] Set up connection pooling (PgBouncer or Prisma Accelerate)
- [ ] Run `prisma migrate deploy` (not `db push`) in production
- [ ] Remove or protect the `/api/health` route
- [ ] Enable HTTPS / set secure cookie flags
- [ ] Set `NODE_ENV=production`

---

## Git Workflow

- **Branch**: `develop` (primary development branch)
- **Remote**: `https://github.com/fazalsamad/zainstore.git`
- **Commit format**: Imperative present tense, noun-phrase subject
  - ✅ `Add vendor approval workflow`
  - ✅ `Fix: missing auth guard on products API`
  - ❌ `Added some stuff`, `fixed bug`
- **Co-author**: All AI-assisted commits include:
  ```
  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  ```
- **Never** push directly to `main`/`master` without a PR review

---

## Known Debt to Address

These are documented issues that should be fixed before adding more features:

1. **Auth guard on `POST /api/products`** — critical security gap
2. **Cross-role middleware** — vendor should not be able to access `/admin/*`
3. **Mobile sidebar** — wire up `useDashboardStore` to a hamburger button
4. **Session refresh after profile update** — call `router.refresh()` or `revalidatePath` after name/avatar change so topbar updates without re-login
5. **Email template brand colours** — `src/lib/email.ts` lines 27 and 42 still use `#0f766e` (old teal). Update to `#faa42d`.
6. **Customer registration address** — `line1: ""` when only city is provided is invalid. Either skip address creation or require full address.
7. **React Query adoption** — use TanStack Query for data-heavy client pages (product tables, order lists) instead of one-shot Server Components, to enable search/filter without full page reloads.
