# Contributing to Guidely

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/guidely.git`
3. Start the dev environment: `docker compose up`
4. Run database migrations: `npm run db:migrate -w apps/backend`
5. Seed data: `npm run db:seed -w apps/backend`

## Development Workflow

- `npm run dev` - Start both backend and frontend in dev mode
- `npm run dev:backend` - Backend only
- `npm run dev:frontend` - Frontend only
- `npm run test` - Run backend tests
- `npm run lint` - Lint all packages
- `npm run typecheck` - TypeScript type checking

## Project Structure

```
guidely/
├── apps/
│   ├── backend/     # Express + TypeScript API
│   │   ├── src/modules/    # Feature modules (users, bookings, payments, etc.)
│   │   ├── src/middleware/  # Express middleware
│   │   ├── src/providers/  # Service providers (video, etc.)
│   │   ├── src/config/     # Configuration
│   │   ├── prisma/         # Database schema & migrations
│   │   └── __tests__/      # Tests
│   └── frontend/    # Next.js application
│       └── src/
│           ├── app/         # Next.js pages (App Router)
│           ├── components/  # Shared components
│           └── lib/         # API client, auth context
└── packages/        # Shared packages (future use)
```

## Code Standards

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Zod schemas for request validation
- Prisma for database access
- Jest + Supertest for backend testing

## Pull Request Process

1. Create a feature branch from `main`
2. Add tests for new functionality
3. Ensure all tests pass: `npm run test`
4. Run type checking: `npm run typecheck`
5. Submit PR with a clear description

## Architecture Decisions

See `docs/architecture/` for Architecture Decision Records (ADRs) explaining key design choices.
