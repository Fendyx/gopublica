# GoPublica — Agent Instructions

> This file defines the operational rules and essential context for all AI agents working in this repository. Read this **before** any coding task.

---

## Mandatory Rules

### 1. Always Read `ARCHITECTURE.md` First

Before writing any code or proposing an implementation plan, read the `ARCHITECTURE.md` file in the root directory. It is the single source of truth for:

- Project structure, boundaries, and hosting environments
- Tech stacks and version constraints per project
- Cross-project communication patterns
- Domain model schemas and relationships
- Exact file paths for every feature (the Module Map)

Do not guess file locations or architectural patterns. Consult the document.

### 2. Cross-Boundary Check

This repository contains **three distinct projects** that share a single backend. Before implementing any feature, determine which project(s) it touches:

| Project | Path | What it handles |
|---------|------|-----------------|
| **backend/** | `backend/` | REST API, database models, auth, payments, notifications |
| **frontend-next/** | `frontend-next/` | GoPublica corporate site — marketing, CRM admin, tenant dashboard |
| **gopublica-core/** | `gopublica-core/` | Multi-tenant SaaS engine — per-tenant admin + public storefront |

**Decision tree**:

- Does it involve a new Mongoose model, API route, or database schema change? → **backend/**
- Does it affect the GoPublica company's own website (marketing, CRM, platform admin)? → **frontend-next/**
- Does it affect tenant-facing features (menu, booking, orders, storefront)? → **gopublica-core/**
- Does it span multiple projects? → Address **all** affected projects in sequence

### 3. Update `ARCHITECTURE.md` When Structural Changes Are Made

If your changes involve any of the following, you **must** update `ARCHITECTURE.md` before concluding the task:

- Creating new domain models (Mongoose schemas)
- Adding new API routes or route groups
- Adding new frontend entities, features, or widgets
- Introducing new third-party integrations
- Structural refactoring that changes file locations
- New global components or shared utilities

Update the relevant section(s): models in §4, file paths in §5, or communication patterns in §3.

---

## Essential Architectural Context

### Three Projects, One Backend

All three projects communicate through the Express backend at port 5000. Both frontends proxy API calls to it, but via different mechanisms:

- **frontend-next**: `next.config.ts` rewrites `/api/*` → `BACKEND_URL`
- **gopublica-core**: `proxy.ts` rewrites domain paths; `apiClient.ts` calls `NEXT_PUBLIC_API_URL` directly

### Multi-Tenant Resolution (Critical Concept)

This is the most important architectural pattern in the system. Every query to the database is scoped by `tenantId`.

**Flow**: Domain name → `proxy.ts` → `/{hostname}/...` → App Router `[tenantDomain]` → Backend `resolve.js` middleware → `TenantSettings` lookup by `domain` or `aliases[]` → `req.tenantId` → all Mongoose queries filter by `{ tenantId }`.

**Rules**:
- Every Mongoose model except `TenantSettings`, `User`, `Lead`, `Client`, `ChangeRequest`, `DemoRequest`, `PortfolioCase`, `PlatformProduct`, and `PlatformNews` has a `tenantId` field that **must** be included in all queries.
- The `TenantSettings.domain` field is globally unique (sparse index). `TenantSettings.aliases[]` contains alternative domains (staging, local dev), max 10, each globally unique.
- `TenantSettings.niche` determines which modules are active: `food`, `restaurant`, `beauty`, `auto`, `ecommerce`.

### Auth Strategies (Three Separate JWT Systems)

| Strategy | Middleware | Use case | Who uses it |
|----------|-----------|----------|-------------|
| GoPublica admin | `jwt` (`middleware/auth/jwt.js`) | Internal CRM (leads, clients, portfolio) | frontend-next `/admin/*` |
| Tenant admin | `authTenant` (`middleware/auth/tenant.js`) | Tenant operations (menu, orders, settings) | gopublica-core `/admin/*` |
| Customer | Inline JWT in route handlers | Customer-facing (orders, profile) | gopublica-core storefront |

**Do not mix these.** A route protecting CRM operations uses `jwt`. A route protecting tenant operations uses `authTenant`. A route allowing customers to place orders uses inline customer JWT validation.

### Feature-Sliced Design (FSD) Layers

Both Next.js projects follow FSD. Place new code in the correct layer:

| Layer | Purpose | Examples |
|-------|---------|---------|
| `shared/` | Low-level, zero-dependency utils | `cn()`, API clients, UI primitives (Button, Card) |
| `entities/` | Domain models — API calls + TypeScript types | `entities/order/api.ts`, `entities/tenant/types.ts` |
| `features/` | User-facing business logic | Form components, wizards, checkout flows |
| `widgets/` | Complex composed UI blocks | Page sections, layouts, dashboards |
| `content/` | Static data exports (no logic) | Legal text, product catalog definitions |

**Rule**: Do not import from higher layers into lower layers. `shared/` must never import from `entities/`, `features/`, or `widgets/`.

### Backend Middleware Chain

When adding new routes, respect the established middleware chain:

```
1. trust proxy → CORS → raw body (Stripe/Telegram) → express.json → JSON error handler → extractConsent
2. Per-route: jwt/authTenant → checkRole → resolveTenant → checkBranch → handler
```

New public routes should use `resolveTenant` to set `req.tenantId`. New admin routes should use the appropriate auth middleware. Stripe webhook routes need `express.raw()` before `express.json()`.

### Backend Route Organization

Routes are registered in `backend/routes/index.js`. The directory structure maps to mount paths:

| Directory | Mount path pattern | Auth |
|-----------|-------------------|------|
| `routes/gopublica/` | `/api/*` (e.g., `/api/auth`, `/api/leads`) | `jwt` + `checkRole` |
| `routes/saas/` | `/api/saas/*` | `authTenant` |
| `routes/public/` | `/api/public/*` | Public (some use inline auth) |
| `routes/stripe/` | `/api/stripe/*` | Mixed (webhook is raw, others authTenant) |
| `routes/platform/` | `/api/platform/*` | `authTenant` or `jwt` (admin) |
| `routes/beauty/` | `/api/beauty/*` | Mixed (public GET, authTenant write) |
| `routes/telegram/` | `/api/telegram/*` | Raw body + secret token |

### Frontend Locale Configuration

| Project | Default locale | Supported locales | Prefix behavior |
|---------|---------------|-------------------|-----------------|
| frontend-next | `en` | `en`, `de`, `pl`, `ru`, `ua`, `es` | Always (`/en/...`) |
| gopublica-core | `pl` | `pl`, `en`, `de`, `uk` | Always (`/pl/...`) |

Note the different default locales and locale sets. Do not confuse them.

### Key Conventions

- **New Mongoose models** go in `backend/models/` (top-level) or `backend/models/{domain}/` (e.g., `models/beauty/`, `models/food/`). Always include `tenantId` unless the model is global (like `PlatformProduct`).
- **New API routes** go in `backend/routes/{group}/`. Always register them in `backend/routes/index.js`.
- **New frontend entities** go in `src/entities/{domain}/` with `api.ts` + `types.ts` split.
- **GDPR consent** is captured via `extractConsent` middleware (sets `req.consentContext`) and stored on models via `_consent` field.
- **Stripe integration**: Webhook handler at `routes/stripe/webhook.js` processes `payment_intent.succeeded`, `customer.subscription.updated/deleted`, `checkout.session.completed`. Subscription logic is in `routes/stripe/subscribe.js`.
- **Telegram integration**: Tenant-specific bots send order/reservation notifications. Bot webhook at `routes/telegram/tenantWebhook.js`. Link/unlink via `routes/saas/telegram.js`.
- **Page builder**: `gopublica-core` uses a section registry (`widgets/Sections/registry.tsx`) that maps `BranchSection.type` strings to React components. Adding a new section type requires: (1) backend model `type` enum update, (2) new component in `widgets/Sections/`, (3) registry entry.
