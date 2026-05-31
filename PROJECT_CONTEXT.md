# ZainStore.pk — Project Context

## Complete Project Summary

ZainStore.pk is a dashboard-only multi-vendor e-commerce platform targeting the Pakistani market. Think Daraz Seller Center + Amazon Seller Central combined into one system. There is no public storefront — only the admin command center and the seller/buyer account dashboards.

**Business model**: ZainStore takes a commission on every sale. Vendors apply to sell, get approved by admin, list products, and request payouts. Customers browse, order, and manage their account.

**Current state**: The foundation (auth, DB schema, routing, theme, profiles) is complete. All 30 module pages are scaffolded as UI shells with sample data. The next major phase is replacing static shells with real database-driven CRUD modules.

---

## Folder Structure

```
/Users/apple/Documents/ZainStore/
├── prisma/
│   ├── schema.prisma          # 44 models, 16 enums, PostgreSQL
│   └── seed.ts                # Seeds admin, 2 vendors, 1 customer, coupon, addresses
├── src/
│   ├── app/
│   │   ├── (auth)/            # Public auth pages (no sidebar layout)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   │   ├── page.tsx   # Role selector (customer vs vendor)
│   │   │   │   ├── customer/  # Single-page customer form
│   │   │   │   └── vendor/    # 4-step vendor form
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   ├── verify-email/
│   │   │   └── confirm-email/ # Email change confirmation
│   │   ├── (dashboard)/       # Protected portal pages (DashboardShell layout)
│   │   │   ├── admin/         # 16 pages (15 modules + profile)
│   │   │   ├── vendor/        # 9 pages (8 modules + profile)
│   │   │   └── customer/      # 8 pages (7 modules + profile)
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/  # NextAuth handler
│   │   │   ├── products/            # GET (active products) + POST (create)
│   │   │   └── health/              # SELECT 1 DB ping
│   │   ├── globals.css        # Tailwind v4 @theme (brand + accent colors)
│   │   ├── layout.tsx         # Root layout (QueryProvider + Sonner Toaster)
│   │   └── page.tsx           # Smart redirect by session role
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── dashboard-shell.tsx    # Layout wrapper (Sidebar + Topbar + main)
│   │   │   ├── sidebar.tsx            # "use client" — active links via usePathname
│   │   │   ├── topbar.tsx             # Server component — fetches session → ProfileDropdown
│   │   │   ├── profile-dropdown.tsx   # "use client" — avatar dropdown + signOut
│   │   │   ├── stat-card.tsx          # KPI card (icon + value + helper text)
│   │   │   ├── revenue-chart.tsx      # "use client" — Recharts AreaChart
│   │   │   ├── pending-actions.tsx    # Action count badges
│   │   │   ├── module-page.tsx        # Generic page scaffold for static pages
│   │   │   └── module-table.tsx       # Table with status Badge colouring
│   │   ├── profile/
│   │   │   └── profile-shell.tsx      # "use client" — all profile tabs + forms
│   │   └── ui/
│   │       ├── avatar.tsx     # Initials fallback with gradient
│   │       ├── badge.tsx      # Tones: default/accent/success/warning/danger/muted
│   │       ├── button.tsx     # CVA variants: default/accent/outline/ghost/danger
│   │       ├── card.tsx       # Card + CardHeader + CardTitle + CardContent
│   │       ├── input.tsx      # forwardRef input with brand focus ring
│   │       └── label.tsx      # Label primitive
│   ├── config/
│   │   └── navigation.ts      # adminNavigation, vendorNavigation, customerNavigation
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── actions.ts     # registerCustomer, registerVendor, forgotPassword, resetPassword, verifyEmail
│   │   │   ├── config.ts      # NextAuth authOptions (JWT strategy, credentials provider)
│   │   │   ├── permissions.ts # Role → permission map, dashboardHomeFor()
│   │   │   └── tokens.ts      # createVerificationToken, createPasswordResetToken, consumeToken
│   │   ├── profile/
│   │   │   └── actions.ts     # updatePersonalInfo, requestEmailChange, changePassword, updateVendorBank, updateVendorStore, updateCustomerAddress
│   │   ├── dashboard/
│   │   │   ├── sample-data.ts # Static data for scaffolded pages
│   │   │   └── portal-pages.ts # vendorModuleRows, customerModuleRows
│   │   ├── db.ts              # Prisma singleton (globalThis pattern)
│   │   ├── email.ts           # sendEmail (console in dev), HTML templates
│   │   ├── format.ts          # formatCurrency (PKR, en-PK locale)
│   │   └── utils.ts           # cn() (clsx + tailwind-merge)
│   ├── middleware.ts           # withAuth protecting /admin/*, /vendor/*, /customer/*
│   ├── providers/
│   │   ├── dashboard-store.ts # Zustand store (sidebarOpen — currently unused)
│   │   └── query-provider.tsx # TanStack React Query provider (configured, not used)
│   └── types/
│       └── next-auth.d.ts     # Augments Session/User/JWT with id + role
├── .env                       # DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_APP_URL
├── .env.example               # Template without secrets
├── .gitignore                 # Excludes .env, .next, node_modules
├── docker-compose.yml         # postgres:16-alpine on port 5432
├── next.config.mjs            # Remote images: unsplash.com, serverActions bodySizeLimit: 2mb
└── package.json               # npm scripts: dev, build, db:generate, db:push, db:seed, setup
```

---

## Database Schema

**Provider**: PostgreSQL 16 | **ORM**: Prisma v6 | **44 models, 16 enums**

### Core Enums

| Enum | Values |
|---|---|
| `UserRole` | SUPER_ADMIN, VENDOR, CUSTOMER |
| `AccountStatus` | ACTIVE, PENDING, SUSPENDED, DISABLED |
| `VendorStatus` | PENDING_APPROVAL, ACTIVE, REJECTED, SUSPENDED |
| `ProductStatus` | DRAFT, PENDING_REVIEW, ACTIVE, REJECTED, ARCHIVED |
| `OrderStatus` | PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED |
| `PaymentStatus` | PENDING, AUTHORIZED, PAID, FAILED, REFUNDED |
| `RefundStatus` | REQUESTED, UNDER_REVIEW, APPROVED, REJECTED, PROCESSED |
| `WithdrawalStatus` | REQUESTED, APPROVED, REJECTED, PROCESSING, PAID, REVERSED |
| `PayoutMethod` | BANK_TRANSFER, EASYPAISA, JAZZCASH, PAYPAL |
| `CommissionType` | PERCENTAGE_OF_SALE, FIXED_AMOUNT, VENDOR_VOLUME_PERCENTAGE, PRODUCT_PRICE_RANGE_PERCENTAGE |
| `CouponType` | PERCENTAGE, FIXED, FREE_SHIPPING |
| `ReviewStatus` | PENDING, APPROVED, REJECTED, FLAGGED |
| `TicketStatus` | OPEN, PENDING_VENDOR, PENDING_CUSTOMER, RESOLVED, CLOSED |
| `SubscriptionStatus` | TRIAL, ACTIVE, PAST_DUE, CANCELLED, EXPIRED |
| `LedgerEntryType` | CREDIT, DEBIT |
| `ShippingMethodType` | FLAT_RATE, FREE_SHIPPING, LOCAL_PICKUP, DISTANCE_RATE |
| `NotificationType` | ORDER, VENDOR, REFUND, WITHDRAWAL, REVIEW, SUPPORT, SYSTEM |

### Model Groups

**Auth & Identity**
- `User` — core user (name, email, passwordHash, role, phone, image, status)
- `Role` — role definitions with JSON permissions
- `Account`, `Session`, `VerificationToken` — NextAuth tables

**Vendor System**
- `VendorProfile` — bank details, commission overrides, status
- `Store` — slug, SEO fields, vacation mode, policies, hours
- `StoreCategory` — store ↔ category join
- `MembershipPlan` — plan tiers with product limits, commission rates, trials
- `VendorSubscription` — active plan per vendor

**Product Catalog**
- `Product` — price, salePrice, stock, status, featured flag, commission override
- `ProductVariant` — options JSON, separate SKU/price/stock
- `ProductImage` — sorted images per product
- `Category` — tree structure (self-referencing parentId), commission override
- `Brand` — brand registry

**Orders & Commerce**
- `Order` — subtotal, discountTotal, shippingTotal, taxTotal, grandTotal
- `OrderItem` — per-vendor line items with commissionTotal
- `Payment` — provider, method, transactionRef
- `Transaction` — general ledger entry
- `OrderTimeline` — status history with actor
- `Address` — user shipping/billing addresses

**Finance**
- `VendorLedgerEntry` — double-entry with running balance
- `CommissionHistory` — per-item commission calculation record
- `Withdrawal` — payout requests with method and status
- `RefundRequest` — full or partial, per order or item

**Promotions**
- `Coupon` — with usage limits, date range, min order
- `CouponProduct`, `CouponCategory`, `CouponVendor` — restriction joins
- `CouponUsage` — usage tracking

**Reviews & Support**
- `Review` — product or store, moderation status, flagged
- `Wishlist` — user ↔ product
- `SupportTicket` — priority, status, vendor link
- `Message` — threaded messages on tickets or direct
- `Dispute` — order dispute between customer and vendor

**Platform**
- `Notification` — typed, per-user, readAt
- `ActivityLog` — audit trail
- `Settings` — key-value store (group, description)
- `AnalyticsSnapshot` — pre-aggregated metrics
- `Banner` — promotional banners with placement
- `ShippingZone`, `ShippingMethod`, `ShippingClass`, `ShipmentTrackingProvider`

---

## API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | DB ping (`SELECT 1`), returns `{ ok: true }` |
| `GET` | `/api/products` | None | Active products with vendor, store, category, brand, images |
| `POST` | `/api/products` | None* | Create product (Zod validated) — *no auth guard yet* |
| `GET/POST` | `/api/auth/[...nextauth]` | — | NextAuth credential handler |

*The `POST /api/products` route has no auth guard — a known issue.*

---

## Features Completed

| Feature | Files |
|---|---|
| Full DB schema + seed data | `prisma/schema.prisma`, `prisma/seed.ts` |
| Login (JWT, remember me) | `(auth)/login/page.tsx`, `lib/auth/config.ts` |
| Customer registration | `(auth)/register/customer/page.tsx`, `lib/auth/actions.ts` |
| Vendor registration (4-step) | `(auth)/register/vendor/page.tsx`, `lib/auth/actions.ts` |
| Forgot / Reset password | `(auth)/forgot-password/`, `(auth)/reset-password/` |
| Email verification | `(auth)/verify-email/`, `lib/auth/tokens.ts` |
| Email change confirmation | `(auth)/confirm-email/` |
| Role-based route protection | `middleware.ts` |
| Smart post-login redirect | `app/page.tsx`, `lib/auth/permissions.ts` |
| Admin portal layout + 15 pages | `(dashboard)/admin/*` |
| Vendor portal layout + 8 pages | `(dashboard)/vendor/*` |
| Customer portal layout + 7 pages | `(dashboard)/customer/*` |
| Header profile dropdown | `components/dashboard/profile-dropdown.tsx` |
| Profile pages (all 3 roles) | `(dashboard)/*/profile/page.tsx` |
| Profile editing (name, phone, avatar) | `lib/profile/actions.ts` — `updatePersonalInfo` |
| Change password (with strength meter) | `lib/profile/actions.ts` — `changePassword` |
| Email change flow | `lib/profile/actions.ts` — `requestEmailChange` |
| Vendor store info editing | `lib/profile/actions.ts` — `updateVendorStore` |
| Vendor bank details editing | `lib/profile/actions.ts` — `updateVendorBank` |
| Customer address editing | `lib/profile/actions.ts` — `updateCustomerAddress` |
| Brand theme (amber + orange-red) | `app/globals.css` |
| Active sidebar navigation | `components/dashboard/sidebar.tsx` |
| Revenue chart | `components/dashboard/revenue-chart.tsx` |
| Avatar with initials fallback | `components/ui/avatar.tsx` |

---

## Features Pending

### High Priority (Phase 3 — Admin Modules)
- [ ] Vendor Management: real list, approve/reject/suspend workflow, commission assignment
- [ ] Customer Management: real list, profile view, ban/unban
- [ ] Product Management: real list, approve/reject with reason, bulk actions, featured toggle
- [ ] Order Management: real list, detail view, status updates, timeline, invoice
- [ ] Refund Management: real list, approve/reject/process, ledger reversal
- [ ] Withdrawal Management: real list, approve/process/reject, payout reference

### Medium Priority (Phase 4 — Vendor Portal)
- [ ] Product CRUD (create/edit/delete, variants, images, stock)
- [ ] Order fulfillment (status updates, invoices)
- [ ] Earnings ledger (VendorLedgerEntry table view)
- [ ] Withdrawal request form
- [ ] Vendor analytics charts
- [ ] Full store profile editor (SEO, hours, vacation mode, policies)

### Medium Priority (Phase 5 — Customer Portal)
- [ ] Order history with detail and tracking
- [ ] Multiple address management (CRUD)
- [ ] Wishlist management
- [ ] Review submission and moderation status
- [ ] Notification inbox (mark read, clear all)

### Low Priority (Phase 6+ — Platform)
- [ ] Commission rules CRUD
- [ ] Coupon CRUD
- [ ] Membership plan builder
- [ ] Shipping zones & methods CRUD
- [ ] Settings key-value editor
- [ ] Support ticket inbox + thread
- [ ] Reports with charts and CSV export
- [ ] Finance dashboard with aggregates
- [ ] Mobile sidebar (hamburger + drawer)
- [ ] File/image upload (currently URL input only)
- [ ] Real email provider (Resend / Nodemailer)
- [ ] Dark mode toggle
- [ ] API authentication guards
- [ ] Rate limiting on auth routes

---

## Known Issues

| # | Issue | Severity | Location |
|---|---|---|---|
| 1 | Email HTML templates use old teal color `#0f766e` instead of brand amber | Low | `src/lib/email.ts` lines 27, 42 |
| 2 | `useDashboardStore` (Zustand sidebar state) is defined but never consumed | Medium | `src/providers/dashboard-store.ts` — no mobile sidebar exists |
| 3 | `POST /api/products` has no authentication guard | High | `src/app/api/products/route.ts` |
| 4 | `rememberMe` checkbox in login is captured but has no effect on session duration | Low | `src/app/(auth)/login/page.tsx` |
| 5 | Session does not update after profile name/email change until re-login | Medium | `src/lib/profile/actions.ts` — needs `revalidatePath` or session refresh |
| 6 | Middleware does not enforce cross-role isolation (vendor can visit `/admin/*`) | High | `src/middleware.ts` |
| 7 | Customer registration creates Address with empty `line1: ""` when city provided | Low | `src/lib/auth/actions.ts` line 72 |
| 8 | `can()` permission helper is defined but never called in any route/page | Medium | `src/lib/auth/permissions.ts` |
| 9 | `@hookform/resolvers` and `react-hook-form` are installed but unused | Low | `package.json` |
| 10 | `NEXTAUTH_SECRET` in `.env` is the placeholder value from dev setup | **Critical** | `.env` — must be rotated before any production deployment |
| 11 | `confirm-email/page.tsx` runs Prisma queries directly in a page, not a server action | Low | `src/app/(auth)/confirm-email/page.tsx` |
| 12 | No `loading.tsx`, `error.tsx`, or `not-found.tsx` pages in any portal | Medium | All dashboard portals |
| 13 | `react-hook-form` provider (`@hookform/resolvers`) is installed but all forms use `useState` | Low | Debt — standardize on one approach |
| 14 | TanStack React Query provider is configured but no queries use it | Low | `src/providers/query-provider.tsx` |
