# ZainStore

Multi-vendor ecommerce starter built with Next.js for both frontend and backend, Tailwind CSS, Prisma, and Postgres.

## Stack

- Next.js App Router for storefront pages and backend route handlers
- React 19 and TypeScript
- Tailwind CSS v4
- Prisma ORM with Postgres
- Docker Compose for local database setup
- Zod for API validation

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer
- Docker Desktop or another Docker-compatible runtime

## Quick Start

```bash
cp .env.example .env
npm install
docker compose up -d db
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Useful Scripts

- `npm run dev` starts the Next.js app.
- `npm run db:push` syncs Prisma schema to the local database.
- `npm run db:seed` loads sample vendors and products.
- `npm run db:studio` opens Prisma Studio.
- `npm run build` creates a production build.

## Backend Layout

- `src/app/api/health/route.ts` verifies the API and database connection.
- `src/app/api/products/route.ts` lists and creates products.
- `src/lib/db.ts` provides the Prisma client.
- `prisma/schema.prisma` defines users, vendors, products, orders, carts, payouts, and reviews.
