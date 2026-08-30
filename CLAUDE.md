# MIRROR Engineering Rules (CLAUDE.md)

This document defines the engineering principles and guidelines for MIRROR development.

## Core Principles

### 1. Source of Truth First

- Read MIRROR_SPEC.md before implementing features.
- Read ARCHITECTURE.md for application architecture and boundaries.
- For engineering standards, follow this document.
- Respect existing architecture unless explicitly conflicting with spec.

> Note: MIRROR_CODEX_PROMPT.md (phase requirements) and MIRROR_UI_UX.md
> (design direction) are referenced by earlier phases but are not currently
> present in this repository. They have not been recreated or fabricated;
> use MIRROR_SPEC.md and ARCHITECTURE.md as the authoritative sources.

### 2. Change Discipline

Make the smallest safe change that completely satisfies the task.

**Do NOT:**
- Perform unrelated refactoring
- Rename unrelated files
- Upgrade dependencies without reason
- Rewrite working components unnecessarily
- Change unrelated styling
- Add speculative abstractions
- Add optional features without approval

**Do:**
- Implement Required work (necessary to satisfy the request)
- Implement Supporting work (necessary for correctness, security, stability)
- Only implement Optional work with explicit approval

### 3. Security-First Mindset

- Frontend visibility is NOT authorization
- Every protected operation must verify: authentication, role, ownership, permission
- Protect secrets from browser code
- Validate all user-controlled input
- Never expose stack traces to users
- Audit all database queries and API calls

### 4. Financial Product Guardrails

MIRROR MVP focuses on:
- Education
- Strategy transparency
- Model portfolios
- Historical information
- Hypothetical simulation

Do NOT implement:
- Automatic trade execution
- Broker connections
- Personalized automated investment advice
- Guaranteed return messaging
- Manipulative urgency mechanics

### 5. No Fabrication

Never invent:
- APIs
- Environment variables
- Database fields
- External services
- Dependencies
- Authentication behavior

Unless required by spec or repo structure.

---

## Development Standards

### TypeScript

- Use strict mode: `"strict": true` in tsconfig.json
- No `any` types without explicit `// @ts-ignore` comment with reason
- All function parameters and return types must be typed
- Use discriminated unions for complex types
- Enable `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`

### File Organization

```
app/
  (auth)/           # Auth-related routes (sign-in, sign-up)
  (public)/         # Public pages (homepage, strategies)
  (learner)/        # Learner dashboard routes (protected)
  (creator)/        # Creator dashboard routes (protected)
  (admin)/          # Admin dashboard routes (protected)
  api/              # API routes
  layout.tsx        # Root layout
  page.tsx          # Root page

components/
  ui/               # Reusable UI primitives (Button, Card, etc.)
  features/         # Feature-specific components
  layout/           # Layout components (Header, Footer, Sidebar)

lib/
  db/               # Database access layer
  auth/             # Authentication utilities
  services/         # Business logic services
  utils/            # Utility functions

prisma/
  schema.prisma     # Database schema
  migrations/       # Database migrations

styles/
  globals.css       # Global styles
  variables.css     # CSS variables
```

### Database

- Use Prisma ORM
- Create migrations for every schema change
- Use proper indexes for frequently queried fields
- Add unique/foreign key constraints
- Never rely on speculative fields
- Document complex relationships

### API Design

- Use server actions for mutations
- Use API routes for external integrations
- Validate all inputs server-side
- Return meaningful error messages
- Never expose sensitive data in responses
- Use consistent response formats

### Components

- Use functional components
- Prefer server components (Next.js 13+)
- Use client components only when interaction requires it
- Keep components focused and composable
- Document complex props
- Handle loading, error, and empty states

### Testing

Prioritize testing for:
- Authentication and authorization
- Ownership and permissions
- Business logic (calculations, state changes)
- Input validation
- Error handling
- Critical user flows

### Code Style

- Use Prettier for formatting
- Use ESLint with Next.js rules
- Prefer named exports
- Use descriptive variable names
- Add comments for non-obvious logic
- Keep functions small and focused

---

## Review Checklist

Before marking work complete:

- [ ] Requested behavior works
- [ ] Existing unrelated behavior is preserved
- [ ] Authorization is correct (server-side verified)
- [ ] Inputs are validated
- [ ] Secrets are protected (not in browser code)
- [ ] Loading states exist where appropriate
- [ ] Error states exist where appropriate
- [ ] Empty states exist where appropriate
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build passes (`npm run build`)
- [ ] Responsive behavior acceptable
- [ ] Accessibility acceptable
- [ ] Security boundaries verified
- [ ] No unrelated files modified
- [ ] Known limitations documented

---

## Verification Commands

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Building
npm run build

# Development
npm run dev

# Formatting
npm run format
```

---

## Known Limitations (Phase 4.5)

- Clerk configuration requires environment variables (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)
- Database requires PostgreSQL running locally or remote connection string
- No database migrations applied yet (schema validated, migration and application pending)
- Role provisioning (assigning CREATOR/ADMIN to existing users) is not yet implemented as a user-facing capability; new users default to LEARNER
- Local identity is keyed by `clerkId` (the authenticated Clerk subject); see lib/db/repositories/user-repository.ts

## Security Boundaries (implemented)

- Clerk authentication is real: /sign-in and /sign-up use Clerk components (no fake forms)
- Middleware blocks unauthenticated access to /learner/*, /creator/*, /admin/*
- Server-side authorization (requireRole) checks the local database User.role — never client state
- Prisma client, repositories, authorization, and session resolution are server-only
- Secrets (CLERK_SECRET_KEY, DATABASE_URL) are never exposed to browser code

---

## Not Verified Yet

- Local development server startup (requires Clerk and DB config)
- Build output optimization
- Browser testing
- Responsive design (Phase 19)
- Accessibility (Phase 19)
- Security audit (Phase 18)

---

## Questions to Ask Before Implementing

Before starting work, clarify:

1. Is this required by MIRROR_SPEC.md?
2. Does this affect architecture?
3. Does this involve financial data or transactions?
4. Is this a security-sensitive operation?
5. Does this require database changes?
6. Does this change existing behavior?

If uncertain, ask the product lead before implementation.
