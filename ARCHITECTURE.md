# GoPublica — Global Architecture Reference

> **Purpose**: Persistent knowledge base for all AI agent sessions. Describes system boundaries, tech stacks, communication patterns, domain models, and file-path mappings across the three repositories.

---

## 1. System Architecture

GoPublica is a **multi-tenant SaaS platform** composed of three distinct projects that share a single Express/MongoDB backend.

```
┌──────────────────────────┐        ┌──────────────────────────┐
│    frontend-next          │        │    gopublica-core         │
│  (GoPublica Corporate)   │        │  (Tenant SaaS Engine)    │
│  Next.js 16 · Vercel     │        │  Next.js 16 · Vercel     │
│                          │        │                           │
│  /[locale]/admin/*  ───CRM       │  /[tenantDomain]/admin/*  │
│  /[locale]/dashboard/* ─Tenant   │  /[tenantDomain]/[locale] │
│  /[locale]/* ── Marketing│        │      /[branchSlug]/*      │
└───────────┬──────────────┘        └───────────┬───────────────┘
            │  /api/* → BACKEND_URL              │  proxy.ts → NEXT_PUBLIC_API_URL
            │  (next.config rewrites)            │  (apiClient direct call)
            ▼                                   ▼
┌────────────────────────────────────────────────────────────────┐
│                        backend                                 │
│              Express 5 · MongoDB (Mongoose 9)                  │
│              Render / Hetzner · Port 5000                      │
│                                                                │
│  /api/auth/*          GoPublica admin auth (sales/User)        │
│  /api/users/*         CRM user management                     │
│  /api/leads/*         Sales leads CRUD                        │
│  /api/clients/*       Client management                       │
│  /api/change-requests/*  Billable tasks                       │
│  /api/portfolio/*     Case studies (public read + admin write) │
│  /api/demo-requests/* Demo funnel                             │
│  /api/saas/*          Tenant admin operations                 │
│  /api/public/*        Customer-facing APIs (auth, orders,     │
│                       jobs, articles, events, branch sections) │
│  /api/stripe/*        Payments, subscriptions, webhooks       │
│  /api/platform/*      Marketplace (products, orders, news)    │
│  /api/beauty/*        Beauty domain (services, masters, appts)│
│  /api/telegram/*      Tenant Telegram bot webhook             │
└────────────────────────────────────────────────────────────────┘
```

### Project Roles

| Project | Role | Audience | Hosting |
|---------|------|----------|---------|
| **`backend/`** | Central REST API — all CRUD, auth, payments, notifications, multi-tenant data isolation | Both frontends + external consumers | **Render or Hetzner** (port 5000) |
| **`frontend-next/`** | GoPublica corporate website — marketing pages, CRM admin panel, tenant dashboard | GoPublica team + prospective/existing tenants | **Vercel** |
| **`gopublica-core/`** | Multi-tenant SaaS engine — per-tenant admin panel + public storefront | End-customers of tenants (restaurant diners, salon clients, etc.) | **Vercel** (PWA-enabled) |

---

## 2. Tech Stack & Architecture Patterns

### 2.1 Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Express** | 5.2.1 | HTTP framework (Express 5 — note: `app.listen`, no `express@5` router change) |
| **Mongoose** | 9.4.1 | MongoDB ODM — all models in `models/` |
| **MongoDB** | — | Primary database (connection via `config/db.js` → `MONGO_URI`) |
| **jsonwebtoken** | 9.x | JWT auth — 3 strategies (see below) |
| **bcryptjs** | 3.x | Password hashing |
| **Stripe** | 22.x | Subscriptions, checkout sessions, payment intents, webhooks |
| **web-push** | 3.x | Browser push notifications (VAPID keys) |
| **Telegram Bot API** | (axios) | Tenant-specific Telegram bots for order/reservation alerts |
| **Multer** | 2.x | File uploads (resumes, general images) |
| **express-rate-limit** | 8.x | API rate limiting |
| **axios** | 1.x | HTTP client for external APIs (Furgonetka logistics, Telegram) |
| **moment-timezone** | 0.6.x | Timezone-aware date handling |

**Middleware chain order** (applied in `config/app.js` and `index.js`):

```
1.  trust proxy                  (for req.ip behind Render/Heroku)
2.  CORS (allow all + credentials)
3.  /api/stripe/webhook          → express.raw() (raw body for Stripe signature)
4.  /api/telegram/tenant/webhook → express.raw() (raw body for Telegram)
5.  express.json({ limit: '10mb' })
6.  JSON parse error handler     (entity.parse.failed / entity.too.large)
7.  extractConsent               → req.consentContext = { ip, userAgent, timestamp }
8.  [Per-route middleware]       → jwt / authTenant / checkRole / checkBranch / resolveTenant
```

**Auth middleware — three strategies**:

| Middleware | File | Purpose | Sets on `req` |
|-----------|------|---------|---------------|
| `jwt` | `middleware/auth/jwt.js` | GoPublica CRM admin auth | `req.user = { id, role, ... }` |
| `authTenant` | `middleware/auth/tenant.js` | SaaS tenant admin auth | `req.tenantId`, `req.userRole`, `req.userId` |
| `checkRole` | `middleware/auth/role.js` | RBAC guard (factory: `checkRole(['admin','superadmin'])`) | — (reads `req.user.role`) |

### 2.2 frontend-next (Corporate)

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.2.7 | App Router framework |
| **React** | 19.2.4 | UI library |
| **TypeScript** | 5.x | Type system |
| **Tailwind CSS** | 4.3.0 | Styling (CSS-first — no `tailwind.config.ts`) |
| **Zustand** | 5.0.14 | State management (`authStore`, `tenantAuthStore`) |
| **next-intl** | 4.13.0 | i18n — 6 locales: `en`, `de`, `pl`, `ru`, `ua`, `es` (default: `en`) |
| **Zod** | 3.25 | Schema validation |
| **React Hook Form** | 7.83 | Form management |
| **Framer Motion** | 12.40 | Animations |
| **Stripe React** | 6.6 | Payment UI components |
| **CVA** | 0.7 | Component variant system |
| **react-markdown** | 10.1 | Markdown rendering (legal pages) |
| **react-icons** | 5.6 | Icon library |
| **lucide-react** | 1.17 | Icon library |

**API proxy**: `next.config.ts` rewrites all `/api/*` → `process.env.BACKEND_URL` (default `http://localhost:5000`).

### 2.3 gopublica-core (Tenant SaaS)

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.2.6 | App Router framework |
| **React** | 19.2.4 | UI library |
| **TypeScript** | 5.x | Type system |
| **Tailwind CSS** | 4.x | Styling (CSS-first) |
| **Shadcn UI** | Radix-based | Component library (Radix UI primitives + Tailwind) |
| **Zustand** | 5.0.14 | State management (`cartStore`, `platformCartStore`) |
| **next-intl** | 4.13.0 | i18n — 6 locales: `pl`, `en`, `de`, `ru`, `ua`, `es` (default: `pl`) |
| **TipTap** | 2.11 | Rich text editor (article body editing) |
| **dnd-kit** | 6.x | Drag-and-drop (page builder, sortable lists) |
| **Recharts** | 3.8 | Analytics dashboard charts |
| **Embla Carousel** | 8.6 | Image/product carousels |
| **Framer Motion** | 12.40 | Animations |
| **Stripe React** | 6.6 | Payment UI |
| **next-themes** | 0.4 | Theme switching (light/dark) |
| **Service Worker** | `public/sw.js` | PWA push notifications |

### 2.4 Architectural Patterns

**Feature-Sliced Design (FSD)** — Both Next.js projects organize code by business domain:

```
shared/    → Low-level reusable: UI primitives, API clients, stores, utils
entities/  → Business domain: API calls + TypeScript types per domain
features/  → User-interacting logic: forms, wizards, business operations
widgets/   → Complex composed UI: page sections, layouts, dashboards
content/   → Static data: legal text, product catalog (frontend-next only)
```

**Middleware-based routing** — Backend applies auth, tenant resolution, consent extraction, and RBAC guards via Express middleware chain, configured per-route.

**Registry pattern** — `gopublica-core` uses `widgets/Sections/registry.tsx` to map `BranchSection.type` strings to React components for the dynamic page builder. Current section types: `hero`, `hero_video`, `entity_carousel`, `feature_carousel`, `booking`, `map`, `menu_categories`, `article_grid`, `dynamic_form`, `contact_block`, `category_list`, plus system types (`system_catalog`, `system_menu`, `system_articles`, `system_gallery`, `system_contacts`, `system_booking_checkout`).

**Custom Pages pattern** — Tenants can create arbitrary landing pages via the Admin Page Builder. Custom pages are stored as `Branch.customPages[]` (title + slug + isActive). Each custom page maps to a storefront route at `/[locale]/[branchSlug]/p/[pageSlug]`. The `BranchSection.page` field stores the custom slug, and sections are rendered via the same `SectionRenderer` pipeline. Reserved slugs (`home`, `catalog`, `menu`, etc.) are blocked on the backend. The Navbar automatically renders links to active custom pages.

**Proxy/rewrite pattern** — Both frontends proxy API calls to the backend via different mechanisms (see §3).

---

## 3. Cross-Project Communication

### 3.1 frontend-next → Backend

| Mechanism | File | Details |
|-----------|------|---------|
| **Next.js rewrites** | `next.config.ts` | `{ source: '/api/:path*', destination: '${BACKEND_URL}/api/:path*' }` |
| **Admin API client** | `src/shared/api/apiClient.ts` | `apiFetch(endpoint)` — attaches JWT from `authStore` (localStorage), calls `/api/...`, auto-logs out on 401 |
| **Tenant API client** | `src/entities/subscription/api/tenantApi.ts` | `authFetch(endpoint)` — attaches JWT from `tenantAuthStore`, calls `NEXT_PUBLIC_API_URL/...` **directly** (bypasses Next.js proxy) |
| **Server-side fetch** | `src/entities/subscription/api/subscriptionApi.ts` | `fetchWithAuth(endpoint, options, token)` — used in React Server Components, explicit token param, throws on 401 |

### 3.2 gopublica-core → Backend

| Mechanism | File | Details |
|-----------|------|---------|
| **Proxy middleware** | `src/proxy.ts` | Extracts `hostname` from request headers → rewrites URL to `/{hostname}/...` for domain-based tenant resolution (see §3.3) |
| **API client** | `src/shared/api/apiClient.ts` | `apiFetch<T>(endpoint)` — calls `NEXT_PUBLIC_API_URL` directly, `cache: 'no-store'`, throws on non-OK |
| **Cached fetch** | `src/shared/api/cachedFetch.ts` | `cachedFetch(url, tags)` — server-side fetch with Next.js cache tags for ISR/revalidation |
| **Tenant context** | `src/entities/tenant/TenantContext.tsx` | React context providing resolved tenant settings to component tree |

### 3.3 Multi-Tenant Resolution — Full Flow

This is the most critical architectural concept. The flow resolves a domain name → tenant → branch → data.

```
User visits: sushi.gopublica.com/en/warszawa/menu
                          │
                          ▼
               ┌─── proxy.ts (middleware) ───┐
               │  1. Extract hostname:       │
               │     "sushi.gopublica.com"   │
               │  2. Rewrite URL:            │
               │     /sushi.gopublica.com/   │
               │     en/warszawa/menu        │
               └────────────┬────────────────┘
                            │
                            ▼
               ┌─── App Router ──────────────┐
               │  Match: /[tenantDomain]/    │
               │         [locale]/           │
               │         [branchSlug]/       │
               │         menu/page.tsx       │
               └────────────┬────────────────┘
                            │
                            ▼
               ┌─── Backend API call ────────┐
               │  GET /api/saas/settings/    │
               │      by-domain?domain=      │
               │      sushi.gopublica.com    │
               │                             │
               │  → resolve.js middleware:   │
               │    Query TenantSettings     │
               │    WHERE domain = host      │
               │    OR aliases CONTAINS host │
               │                             │
               │  → req.tenant = found doc   │
               │  → req.tenantId = tenantId  │
               └────────────┬────────────────┘
                            │
                            ▼
               ┌─── Data isolation ──────────┐
               │  All Mongoose queries:      │
               │  { tenantId: req.tenantId } │
               │                             │
               │  Branch resolved via:       │
               │  [branchSlug] param or      │
               │  TenantSettings.defaultBranch│
               └─────────────────────────────┘
```

**Backend middleware details**:

| Middleware | File | Logic |
|-----------|------|-------|
| **resolveTenant** | `middleware/tenant/resolve.js` | Extracts `host` header → strips port → queries `TenantSettings` where `domain = host` OR `aliases` array contains host → sets `req.tenant` and `req.tenantId` |
| **checkBranch** | `middleware/tenant/branch.js` | Resolves branch from `req.params.branchId` / `req.body.branchId` / `req.query.branchId` or `branchSlug` → validates it belongs to `req.tenantId` → sets `req.branch` |

**Key model fields for tenancy**:

| Model | Field | Type | Index |
|-------|-------|------|-------|
| `TenantSettings` | `tenantId` | String (unique) | Unique |
| `TenantSettings` | `domain` | String (unique, sparse) | Unique sparse |
| `TenantSettings` | `aliases` | Array[String] (max 10, unique per element) | Unique per element |
| All other models | `tenantId` | String | Non-unique (queries always filter by this) |

---

## 4. Key Domain Models

### 4.1 Tenant & Identity

| Model | File | Key Fields | Notes |
|-------|------|-----------|-------|
| **TenantSettings** | `models/TenantSettings.js` | `tenantId` (unique), `businessName`, `domain` (unique sparse), `aliases[]`, `niche` (food/restaurant/beauty/auto/ecommerce), `moduleAccess`, `theme`, `features`, `payments`, `legal` (NIP/REGON/KRS), `primaryLanguage` (deprecated), `activeLocales[]`, `defaultLocale`, `primaryCurrency`, `notifications.telegram`, `logistics`, `navigation` (items[], dropdownLabel) | **Central tenant config — the identity document.** `navigation` stores the tenant's Navbar customization: which links appear in the primary bar vs. the "More" dropdown, their order, visibility, and label overrides. |
| **TenantUser** | `models/TenantUser.js` | `email` (unique), `passwordHash`, `tenantId`, `role` (client_admin/client_manager), `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`, `subscriptionPlan`, `telegramChatId`, `telegramLinkToken` | Tenant admin users |
| **Site** | `models/Site.js` | `tenantId`, `name`, `type` (primary/subdomain/landing/microsite), `domain`, `subdomain`, `status` (building/staging/live/error/paunched), `niche`, `theme`, `createdUnderPlan` | Multi-site per tenant (plan limits: basic=1, pro=10) |

### 4.2 Branch & Page Builder

| Model | File | Key Fields | Notes |
|-------|------|-----------|-------|
| **Branch** | `models/Branch.js` | `tenantId`, `name`, `slug` (unique per tenant), `city`, `address`, `coordinates`, `isDefault`, `parentBranchId` (self-ref for sub-branches), `venueType` (main/concept), `settingsOverride`, `hasOnlineOrdering`, `customPages[]` | Multi-branch with sub-branch support. `customPages[]` stores tenant-created landing pages managed via Admin Page Builder. |
| **Branch.customPages[]** | (embedded in Branch) | `title` (String, required), `slug` (String, unique per tenant, lowercase slug format), `isActive` (Boolean, default true), `createdAt` (Date) | Arbitrary landing pages. Each entry maps to storefront route `/[locale]/[branchSlug]/p/[slug]`. Sections are stored in `BranchSection` with `page === slug`. Reserved slugs blocked: `home`, `catalog`, `menu`, `contacts`, `gallery`, `articles`, `reservations`, `partners`, `order`, `login`, `profile`, `admin`. |
| **BranchSection** | `models/BranchSection.js` | `tenantId`, `branchId`, `page` (home/partners/about-us/reservations + any custom slug), `type` (hero_video/hero/entity_carousel/feature_carousel/booking/map/menu_categories/article_grid/dynamic_form/contact_block/category_list/rich_text + system_*), `order`, `settings` (Mixed), `translations` (Mixed) | Dynamic page builder sections. `page` field accepts arbitrary slugs — custom pages use their slug as the `page` value. |
| **BranchSectionItem** | `models/BranchSectionItem.js` | `tenantId`, `branchId`, `sectionId`, `slug` (unique per tenant), `media` ({type, url}), `order`, `translations`, `body`, `gallery[]`, `attributes[]`, `isActive` | Content items within sections |

### 4.3 Customer & Orders

| Model | File | Key Fields | Notes |
|-------|------|-----------|-------|
| **Customer** | `models/Customer.js` | `tenantId`, `email` (unique per tenant), `phone`, `name`, `addresses[]`, `ordersCount`, `totalSpent`, `createdViaOrder` | CRM entity for tenant's customers |
| **CustomerUser** | `models/CustomerUser.js` | `email` (unique), `passwordHash`, `tenantId`, `consents`, `_consent` | End-customer auth (JWT with `role: 'customer'`) |
| **Order** | `models/food/Order.js` | `tenantId`, `branchId`, `customerId` → Customer, `customerUserId` → CustomerUser, `items[]` (menu_item or ticket), `fulfillment` (pickup/delivery/digital + parcelLocker for Furgonetka), `pricing`, `confirmation`, `status`, `payment`, `shipping`, `_consent` | Complex order with ticket support, parcel locker integration, Stripe |
| **Reservation** | `models/food/Reservation.js` | `tenantId`, `branchId`, `name`, `phone`, `email`, `date`, `time`, `guests`, `status`, `_consent` | Simple table reservation |
| **MenuItem** | `models/food/MenuItem.js` | `tenantId`, `branchId`, `name`, `price`, `categoryKey`, `modifierGroups[]`, `variants[]`, `translations`, `attributes[]`, `isFeatured`, `productType` (food/service/physical_product/digital) | Rich menu item with modifiers, variants, i18n |
| **CategoryTranslation** | `models/food/CategoryTranslation.js` | `key` (unique per tenant), `tenantId`, `name`, `translations`, `icon`, `niche`, `layout`, `coverImage`, `cardBgColor`, `productCardVariant` | Translatable category with layout options |

### 4.4 Beauty Domain

| Model | File | Key Fields | Notes |
|-------|------|-----------|-------|
| **BeautyService** | `models/beauty/ServiceItem.js` | `tenantId`, `branchId`, `name`, `price`, `durationMinutes`, `categoryKey`, `translations` | Service catalog |
| **BeautyMaster** | `models/beauty/Master.js` | `tenantId`, `branchId`, `name`, `languages[]`, `specializations[]`, `services[]` → BeautyService, `schedule` (Map of weekly entries), `breaks[]`, `overrides[]`, `timezone` | Staff with complex scheduling |
| **BeautyAppointment** | `models/beauty/Appointment.js` | `tenantId`, `branchId`, `serviceId`, `masterId`, `customerId`, `guestInfo`, `startAt`, `endAt`, `status`, `paymentStatus`, `_consent` | Beauty bookings |
| **BeautyCategory** | `models/beauty/Category.js` | `key` (unique), `tenantId`, `name`, `translations`, `businessType` | Beauty service categories |

### 4.5 Universal Booking

| Model | File | Key Fields | Notes |
|-------|------|-----------|-------|
| **ServiceAppointment** | `models/booking/ServiceAppointment.js` | `tenantId`, `branchId`, `customerId`, `guestInfo`, `services[]` (frozen name+price), `startAt`, `endAt`, `status`, `metadata` (Mixed, niche-specific), `notes`, `_consent` | Generic service booking — metadata allows niche-specific extensions |

### 4.6 Content

| Model | File | Key Fields | Notes |
|-------|------|-----------|-------|
| **Article** | `models/content/Article.js` | `tenantId`, `title`, `slug` (unique per tenant), `coverImage`, `videoUrl`, `body` (Mixed: HTML or block JSON), `bodyFormat`, `author`, `publishedAt`, `seoTitle`, `seoDescription` | Blog/news with flexible body format |
| **Event** | `models/content/Event.js` | `tenantId`, `articleId` (1:1 unique), `ticketPrice`, `totalTickets`, `ticketsSold`, `ticketsRemaining`, `eventDate`, `venueName`, `maxPerOrder`, `isSoldOut` | Ticketed events — 1:1 with Article |
| **GalleryItem** | `models/content/GalleryItem.js` | `tenantId`, `branchId`, `image`, `caption`, `order` | Media gallery |

### 4.7 HR

| Model | File | Key Fields | Notes |
|-------|------|-----------|-------|
| **JobApplication** | `models/hr/JobApplication.js` | `tenantId`, `branchId`, `sourceSectionId` → BranchSection, `fields` (Map, dynamic), `resumeUrl`, `status` (new/viewed/invited/rejected/hired), `_consent` | Applications with dynamic form fields |
| **JobFormSettings** | `models/hr/JobFormSettings.js` | `tenantId` (unique), `fields[]` (configurable form schema with i18n) | Per-tenant configurable job application form |

### 4.8 Platform Marketplace

| Model | File | Key Fields | Notes |
|-------|------|-----------|-------|
| **PlatformProduct** | `models/platform/PlatformProduct.js` | `title`, `price`, `currency`, `photo`, `gallery[]`, `specs[]`, `targetNiches[]`, `category` (hardware/digital/service), `stock` | Cross-tenant product catalog |
| **PlatformOrder** | `models/platform/PlatformOrder.js` | `tenantId`, `buyerType` (private/business), `items[]`, `paymentMethod`, `fulfillment` (parcel_locker/courier/cod), `pricing`, `shipping` | Tenant purchases from marketplace |
| **PlatformNews** | `models/platform/PlatformNews.js` | `title`, `content`, `type` (info/update/announcement/promo), `isActive`, `publishedAt` | Platform-wide announcements |

### 4.8a Ecommerce — Product Attributes

| Model | File | Key Fields | Notes |
|-------|------|-----------|-------|
| **ProductAttribute** | `models/ecommerce/ProductAttribute.js` | `tenantId`, `type` (author/publisher/genre/language/series/custom), `name`, `slug`, `translations` (Map), `description`, `image`, `productCount`, `isActive` | Managed attribute entities for books/merch (authors, publishers, genres, etc.). Compound unique index on `(tenantId, type, slug)`. |

**MenuItem extensions** (added to `models/food/MenuItem.js`):
- `attributeRefs: [{ type: String, attributeId: String }]` — links to `ProductAttribute._id`. Used for filtering, search, entity pages.
- `status: String` enum `['published', 'draft', 'hidden']` — product visibility control.
- `CategoryTranslation` extension: `parentCategoryKey: String` — enables hierarchical categories.

### 4.9 Sales / CRM

| Model | File | Key Fields | Notes |
|-------|------|-----------|-------|
| **User** | `models/sales/User.js` | `name`, `email` (unique), `password`, `role` (user/admin/superadmin) | GoPublica internal admin users |
| **Lead** | `models/sales/Lead.js` | `name`, `phone`, `status` (New/In Progress/Closed/Rejected/Call Back/No Answer/etc.), `price`, `businessType`, `priority`, `createdBy`, `assignedTo` | Sales pipeline |
| **Client** | `models/sales/Client.js` | `leadId` → Lead, `name`, `phone`, `email`, `country`, `businessType`, `status`, `stripeCustomerId` | Converted leads |
| **ChangeRequest** | `models/sales/ChangeRequest.js` | `clientId` → Client, `title`, `status`, `price`, `billable`, `priority`, `assignedTo` | Billable tasks per client |
| **DemoRequest** | `models/sales/DemoRequest.js` | `businessType`, `goals`, `contactMethod`, `contact`, `status`, `convertedToLead` → Lead | Demo funnel submissions |
| **PortfolioCase** | `models/sales/PortfolioCase.js` | `title`, `slug` (unique), `niche`, `heroImages[]`, `liveUrl`, `challenge`, `solution`, `metrics[]`, `features[]`, `gallery[]`, `techStack[]`, `pricing`, `isPublished` | Case studies (public read) |

### 4.10 Audit & Consent

| Model | File | Key Fields | Notes |
|-------|------|-----------|-------|
| **ConsentLog** | `models/audit/ConsentLog.js` | `entityType` (Order/Reservation/etc.), `entityId`, `tenantId`, `userId`, `type`, `granted`, `ip`, `userAgent`, `consentVersion` | GDPR audit trail |
| **ConsentRecord** | `models/payments/ConsentRecord.js` | `userId`, `type` (terms/privacy/marketing), `granted`, `ip`, `userAgent` | User consent records |

### 4.11 Frontend Entity Mapping

| Domain | Backend Model | gopublica-core Entity | frontend-next Entity |
|--------|--------------|----------------------|---------------------|
| Tenant | TenantSettings | `entities/tenant/` (api.ts, types.ts, TenantContext.tsx, useTenantSettings.ts, utils.ts) | `entities/subscription/` (tenantApi.ts) |
| Branch | Branch | `entities/branch/` | — |
| Branch Sections | BranchSection, BranchSectionItem | `entities/branch-section/` | — |
| Menu | MenuItem | `entities/menu-item/` | — |
| Order | Order | `entities/order/` (api.ts, types.ts) | `entities/platformOrder/` (ordersApi.ts, types.ts) |
| Customer | Customer | `entities/customer/` | — |
| Article | Article | `entities/article/` | — |
| Gallery | GalleryItem | `entities/gallery/` | — |
| Beauty | BeautyService, BeautyMaster | `entities/beauty/` | — |
| Reservation | Reservation | `entities/reservation/` | — |
| Telegram | PushSubscription | `entities/telegram/` | — |
| Platform Product | PlatformProduct | `entities/platformProduct/` | `entities/platformProduct/` (productsApi.ts, types.ts) |
| Platform Order | PlatformOrder | — | `entities/platformOrder/` (ordersApi.ts, types.ts) |
| Platform News | PlatformNews | — | `entities/platformNews/` (newsApi.ts, types.ts) |
| Lead | Lead | — | `entities/lead/` (leadsApi.ts, types.ts) |
| Client | Client | — | `entities/client/` (clientsApi.ts) |
| Demo | DemoRequest | — | `entities/demoRequest/` (demoRequestsApi.ts) |

---

## 5. Module Map

> Every row maps a feature to its **exact file paths** across all three repositories. Paths are relative to each project root.

### 5.1 Authentication & Users

| Feature | backend/ | gopublica-core/ | frontend-next/ |
|---------|----------|----------------|----------------|
| GoPublica admin auth | `routes/gopublica/auth.js`, `models/sales/User.js` | — | `src/app/[locale]/admin/login/page.tsx`, `src/store/authStore.ts`, `src/widgets/AdminLogin/AdminLoginForm.tsx` |
| Tenant user auth | `routes/saas/auth.js`, `models/TenantUser.js` | `src/app/[tenantDomain]/admin/login/` | `src/app/[locale]/login-client/`, `src/app/[locale]/register-client/`, `src/entities/subscription/api/tenantApi.ts` |
| Customer auth | `routes/public/auth.js`, `models/CustomerUser.js` | `src/app/[tenantDomain]/[locale]/login/`, `register/` | — |
| JWT middleware | `middleware/auth/jwt.js`, `middleware/auth/tenant.js`, `middleware/auth/role.js` | — | — |

### 5.2 Multi-Tenant Resolution

| Feature | backend/ | gopublica-core/ | frontend-next/ |
|---------|----------|----------------|----------------|
| Domain → Tenant | `middleware/tenant/resolve.js`, `models/TenantSettings.js` | `src/proxy.ts`, `src/entities/tenant/TenantContext.tsx`, `src/entities/tenant/api.ts` | — (auth-based, no domain routing) |
| Branch resolution | `middleware/tenant/branch.js`, `models/Branch.js` | `[branchSlug]` route segment in `src/app/[tenantDomain]/[locale]/[branchSlug]/` | — |

### 5.3 Menu & E-Commerce

| Feature | backend/ | gopublica-core/ | frontend-next/ |
|---------|----------|----------------|----------------|
| Menu CRUD (admin) | `routes/saas/menu.js`, `models/food/MenuItem.js` | `src/app/[tenantDomain]/admin/menu/`, `src/features/ecommerce-management/` (ProductForm.tsx, CategoryForm.tsx, SortableCategoryList.tsx) | — |
| Menu display (public) | `routes/public/branchSections.js` | `src/app/[tenantDomain]/[locale]/[branchSlug]/menu/`, `src/widgets/Menu/` | — |
| Categories (hierarchical) | `routes/saas/categories.js`, `models/food/CategoryTranslation.js` (parentCategoryKey) | `src/features/ecommerce-management/CategoryForm.tsx` | — |
| Product Attributes (admin) | `routes/saas/productAttributes.js`, `models/ecommerce/ProductAttribute.js` | `src/features/ecommerce-management/AttributeManager.tsx`, `src/entities/product-attribute/` (types.ts, api.ts) | — |
| Product Search (public) | `routes/public/productSearch.js` | `src/widgets/Catalog/SearchBar.tsx`, `src/widgets/Catalog/CatalogSearchClient.tsx`, `src/app/[tenantDomain]/[locale]/[branchSlug]/catalog/search/` | — |
| Related Products (public) | `routes/public/relatedProducts.js` | `src/widgets/Catalog/RelatedProducts.tsx`, `src/entities/product/api.ts` | — |
| Entity Pages (author/publisher/genre) | `routes/saas/menu.js` (attributeRefType/attributeRefId filter) | `src/widgets/Catalog/EntityPage.tsx`, `src/app/[tenantDomain]/[locale]/[branchSlug]/catalog/[type]/[slug]/` | — |
| Faceted Filters | — | `src/widgets/Catalog/FilterSidebar.tsx` | — |
| Cart / Checkout | `routes/orders/public.js` | `src/shared/store/cartStore.ts`, `src/widgets/Checkout/` | — |
| Menu filter | — | `src/features/menu-filter/` | — |

### 5.4 Reservations & Booking

| Feature | backend/ | gopublica-core/ | frontend-next/ |
|---------|----------|----------------|----------------|
| Table reservations (admin) | `routes/saas/reservations.js`, `models/food/Reservation.js` | `src/app/[tenantDomain]/admin/reservations/` | — |
| Reservation form (public) | (inline in saas routes) | `src/features/reservation/BookingForm.tsx`, `src/app/[tenantDomain]/[locale]/[branchSlug]/reservations/` | — |
| Service booking (universal) | `routes/saas/appointments.js`, `models/booking/ServiceAppointment.js` | `src/widgets/ServiceBooking/`, `src/app/[tenantDomain]/[locale]/[branchSlug]/booking/` | — |
| Beauty services CRUD | `routes/saas/beauty/services.js`, `routes/beauty/services.js`, `models/beauty/ServiceItem.js` | `src/entities/beauty/`, `src/app/[tenantDomain]/admin/beauty-services/` | — |
| Beauty masters CRUD | `routes/saas/beauty/masters.js`, `routes/beauty/masters.js`, `models/beauty/Master.js` | `src/entities/beauty/`, `src/app/[tenantDomain]/admin/beauty-masters/` | — |
| Beauty appointments | `routes/saas/beauty/appointments.js`, `routes/beauty/appointments.js`, `models/beauty/Appointment.js` | `src/entities/beauty/` | — |

### 5.5 Orders

| Feature | backend/ | gopublica-core/ | frontend-next/ |
|---------|----------|----------------|----------------|
| Tenant order management | `routes/saas/orders.js`, `models/food/Order.js` | `src/app/[tenantDomain]/admin/orders/` | — |
| Customer order history | `routes/public/orders.js` | `src/app/[tenantDomain]/[locale]/order/` | — |
| Order checkout (public) | `routes/orders/public.js` (inline `getTenant`) | `src/widgets/Checkout/`, `src/shared/store/cartStore.ts` | — |
| Platform orders | `routes/platform/orders.js`, `models/platform/PlatformOrder.js` | `src/entities/platformProduct/` (related) | `src/app/[locale]/admin/platform-orders/`, `src/widgets/PlatformOrdersAdminPage/`, `src/entities/platformOrder/` |

### 5.6 Content Management

| Feature | backend/ | gopublica-core/ | frontend-next/ |
|---------|----------|----------------|----------------|
| Articles (admin) | `routes/saas/articles.js`, `models/content/Article.js` | `src/app/[tenantDomain]/admin/articles/`, `src/entities/article/` | — |
| Articles (public) | `routes/public/articles.js` | `src/app/[tenantDomain]/[locale]/[branchSlug]/articles/` | — |
| Events (admin) | `routes/saas/events.js`, `models/content/Event.js` | `src/entities/article/` (merged with article) | — |
| Events (public) | `routes/public/events.js` | `src/app/[tenantDomain]/[locale]/[branchSlug]/` (articles) | — |
| Gallery (admin) | `routes/saas/gallery.js`, `models/content/GalleryItem.js` | `src/app/[tenantDomain]/admin/gallery/`, `src/widgets/Gallery/`, `src/entities/gallery/` | — |
| Page builder (admin) | `routes/saas/branchSections.js`, `models/BranchSection.js`, `models/BranchSectionItem.js` | `src/app/[tenantDomain]/admin/page-builder/`, `src/widgets/Sections/` (SectionRenderer.tsx, registry.tsx + 14 section components including 6 system types) | — |
| Custom pages (admin) | `routes/saas/branches.js` (custom-pages sub-routes), `models/Branch.js` (`customPages[]`) | `src/app/[tenantDomain]/admin/page-builder/page.tsx` (tabs merge + Add Page dialog), `src/entities/branch/api.ts` (fetchCustomPages, createCustomPage, updateCustomPage, deleteCustomPage) | — |
| Custom pages (storefront) | `routes/public/branchSections.js` (reused — queries by `page` slug) | `src/app/[tenantDomain]/[locale]/[branchSlug]/p/[pageSlug]/page.tsx` | — |
| Public page sections | `routes/public/branchSections.js` | `src/widgets/Sections/SectionRenderer.tsx`, `src/widgets/Sections/registry.tsx` | — |
| Dynamic forms | `routes/saas/formSubmissions.js`, `routes/public/formSubmissions.js`, `models/hr/JobApplication.js` (reused) | `src/features/dynamic-form/`, `src/widgets/Sections/DynamicFormSection.tsx` | — |

### 5.7 CRM & Sales

| Feature | backend/ | gopublica-core/ | frontend-next/ |
|---------|----------|----------------|----------------|
| Leads CRUD | `routes/gopublica/leads.js`, `models/sales/Lead.js` | — | `src/app/[locale]/admin/leads/`, `src/entities/lead/` (leadsApi.ts, types.ts), `src/widgets/LeadsCRMPage/` |
| Clients CRUD | `routes/gopublica/clients.js`, `models/sales/Client.js` | — | `src/app/[locale]/admin/clients/`, `src/entities/client/` (clientsApi.ts), `src/widgets/ClientsAdminPage/` |
| Change requests | `routes/gopublica/changeRequests.js`, `models/sales/ChangeRequest.js` | — | — |
| Portfolio | `routes/gopublica/portfolio.js`, `models/sales/PortfolioCase.js` | — | `src/app/[locale]/portfolio/` |
| Demo requests | `routes/gopublica/demoRequests.js`, `models/sales/DemoRequest.js` | — | `src/app/[locale]/demo/`, `src/widgets/DemoQuiz/` (multi-step wizard), `src/entities/demoRequest/` |

### 5.8 Platform Marketplace

| Feature | backend/ | gopublica-core/ | frontend-next/ |
|---------|----------|----------------|----------------|
| Products CRUD | `routes/platform/products.js`, `models/platform/PlatformProduct.js` | `src/entities/platformProduct/` | `src/app/[locale]/admin/platform-products/`, `src/entities/platformProduct/` (productsApi.ts, types.ts), `src/widgets/PlatformProductsAdminPage/` |
| Platform news | `routes/platform/news.js`, `models/platform/PlatformNews.js` | — | `src/app/[locale]/admin/platform-news/`, `src/entities/platformNews/` (newsApi.ts, types.ts), `src/widgets/PlatformNewsAdminPage/` |

### 5.9 Payments & Subscriptions

| Feature | backend/ | gopublica-core/ | frontend-next/ |
|---------|----------|----------------|----------------|
| Stripe webhook | `routes/stripe/webhook.js` | — | — |
| Checkout / subscribe | `routes/stripe/checkout.js`, `routes/stripe/subscribe.js` | — | `src/features/billing/` (PricingCards.tsx, SubscribeForm.tsx, actions.ts), `src/app/[locale]/subscribe/` |
| Cancel subscription | `routes/stripe/cancel.js` | — | — |
| Prices | `routes/stripe/prices.js` | — | — |
| Setup intent | `routes/stripe/setupIntent.js` | — | — |
| Tenant billing | — | `src/app/[tenantDomain]/admin/settings/` (billing section) | `src/app/[locale]/dashboard/billing/`, `src/widgets/Dashboard/BillingPage.tsx` |

### 5.10 Push Notifications & Telegram

| Feature | backend/ | gopublica-core/ | frontend-next/ |
|---------|----------|----------------|----------------|
| Web push subscribe | `routes/saas/push.js`, `config/push.js` | `public/sw.js` (service worker) | — |
| Telegram bot webhook | `routes/telegram/tenantWebhook.js`, `services/notifications/tenantTelegram.js` | — | — |
| Telegram link/unlink | `routes/saas/telegram.js` | `src/entities/telegram/` | — |

### 5.11 Analytics

| Feature | backend/ | gopublica-core/ | frontend-next/ |
|---------|----------|----------------|----------------|
| Page tracking (POST) | `routes/saas/analytics.js`, `models/analytics/Analytics.js` | `src/shared/ui/TrackVisit.tsx` | — |
| Analytics dashboard (GET) | `routes/saas/analytics.js` | `src/features/analytics/AnalyticsDashboard.tsx` | — |

### 5.12 Settings & Configuration

| Feature | backend/ | gopublica-core/ | frontend-next/ |
|---------|----------|----------------|----------------|
| Tenant settings (admin) | `routes/saas/settings.js`, `models/TenantSettings.js` | `src/app/[tenantDomain]/admin/settings/`, `src/entities/tenant/` (api.ts, types.ts, useTenantSettings.ts) | `src/app/[locale]/dashboard/settings/`, `src/widgets/Dashboard/SettingsPage.tsx` |
| Branch management | `routes/saas/branches.js`, `models/Branch.js` | `src/app/[tenantDomain]/admin/branches/`, `src/entities/branch/` | — |
| Site management | `routes/saas/sites.js`, `models/Site.js` | — | `src/app/[locale]/dashboard/sites/`, `src/widgets/Dashboard/SitesPage.tsx` |
| Dashboard overview | `routes/saas/dashboard.js` | `src/app/[tenantDomain]/admin/page.tsx` | `src/app/[locale]/dashboard/page.tsx`, `src/widgets/Dashboard/OverviewPage.tsx` |

### 5.13 HR & Jobs

| Feature | backend/ | gopublica-core/ | frontend-next/ |
|---------|----------|----------------|----------------|
| Job form settings | `routes/saas/jobs.js`, `models/hr/JobFormSettings.js` | `src/app/[tenantDomain]/admin/jobs/` | — |
| Job applications | `routes/public/jobs.js`, `models/hr/JobApplication.js` | `src/app/[tenantDomain]/[locale]/careers/` | — |

### 5.14 GDPR & Consent

| Feature | backend/ | gopublica-core/ | frontend-next/ |
|---------|----------|----------------|----------------|
| Consent extraction | `middleware/common/extractConsent.js` | — | — |
| Consent audit log | `models/audit/ConsentLog.js` | — | — |
| Consent checkboxes UI | — | `src/shared/ui/ConsentCheckboxes.tsx` | `src/shared/ui/ConsentCheckboxes.tsx` |

### 5.15 Corporate Marketing (frontend-next only)

| Feature | File |
|---------|------|
| Homepage | `src/app/[locale]/page.tsx`, `src/widgets/HomePage/` (HeroSection.tsx, HomeSolutionsSection.tsx, TrustMarquee.tsx) |
| Pricing | `src/app/[locale]/pricing/page.tsx` (server-rendered, geo-currency detection) |
| Solutions hub | `src/app/[locale]/solutions/`, `src/widgets/SolutionsHub/` (PillNav.tsx, SolutionCard.tsx, SolutionsGrid.tsx) |
| Solution detail | `src/app/[locale]/solutions/[slug]/page.tsx`, `src/widgets/SolutionDetail/` |
| Contact | `src/app/[locale]/contact/page.tsx`, `src/widgets/ContactPage/` |
| Demo quiz | `src/app/[locale]/demo/page.tsx`, `src/widgets/DemoQuiz/` (5 files: widget, steps, forms) |
| Presentation | `src/app/[locale]/presentation/page.tsx`, `src/widgets/Presentation/` |
| Calculator | `src/app/[locale]/calculator/page.tsx` |
| Agency pages | `src/app/[locale]/agency-food/`, `agency-beauty-grooming/`, `agency-other/` |
| Legal pages | `src/app/[locale]/privacy/`, `src/app/[locale]/terms/`, `src/content/legal/` (privacy-en.ts, terms-en.ts) |
| Sitemap | `src/app/sitemap.ts` |
| Layout / Navbar / Footer | `src/app/[locale]/layout.tsx`, `src/widgets/Layout/` (Navbar.tsx, Footer.tsx) |
| Global UI | `src/shared/ui/` (Button.tsx, Card.tsx, ConsentCheckboxes.tsx, LanguageSelector.tsx) |
| Styling | `src/app/globals.css` (Tailwind v4 CSS variables), `src/shared/lib/utils.ts` (`cn()`) |

### 5.16 Tenant Admin Pages (gopublica-core only)

| Feature | File |
|---------|------|
| Admin layout | `src/app/[tenantDomain]/admin/layout.tsx` |
| Admin login | `src/app/[tenantDomain]/admin/login/` |
| Dashboard | `src/app/[tenantDomain]/admin/page.tsx` |
| Menu management | `src/app/[tenantDomain]/admin/menu/` |
| E-commerce management | `src/features/ecommerce-management/` (ProductForm.tsx, CategoryForm.tsx, SortableCategoryList.tsx) |
| Orders | `src/app/[tenantDomain]/admin/orders/` |
| Reservations | `src/app/[tenantDomain]/admin/reservations/` |
| Branches | `src/app/[tenantDomain]/admin/branches/` |
| Customers | `src/app/[tenantDomain]/admin/customers/` |
| Gallery | `src/app/[tenantDomain]/admin/gallery/` |
| Articles | `src/app/[tenantDomain]/admin/articles/` |
| Jobs | `src/app/[tenantDomain]/admin/jobs/` |
| Submissions | `src/app/[tenantDomain]/admin/submissions/` |
| Settings | `src/app/[tenantDomain]/admin/settings/` |
| Page builder | `src/app/[tenantDomain]/admin/page-builder/` |
| Beauty services | `src/app/[tenantDomain]/admin/beauty-services/` |
| Beauty masters | `src/app/[tenantDomain]/admin/beauty-masters/` |
| Analytics | `src/app/[tenantDomain]/admin/analytics/`, `src/features/analytics/AnalyticsDashboard.tsx` |
| GoPublica settings | `src/app/[tenantDomain]/admin/gopublica/` |

### 5.17 Tenant Public Storefront (gopublica-core only)

| Feature | File |
|---------|------|
| Storefront layout | `src/app/[tenantDomain]/[locale]/layout.tsx` |
| Home page | `src/app/[tenantDomain]/[locale]/page.tsx` |
| Branch pages | `src/app/[tenantDomain]/[locale]/[branchSlug]/page.tsx` |
| Menu | `src/app/[tenantDomain]/[locale]/[branchSlug]/menu/` |
| Booking | `src/app/[tenantDomain]/[locale]/[branchSlug]/booking/` |
| Reservations | `src/app/[tenantDomain]/[locale]/[branchSlug]/reservations/` |
| Order | `src/app/[tenantDomain]/[locale]/order/` |
| Catalog | `src/app/[tenantDomain]/[locale]/[branchSlug]/catalog/` |
| Articles | `src/app/[tenantDomain]/[locale]/[branchSlug]/articles/` |
| Partners | `src/app/[tenantDomain]/[locale]/[branchSlug]/partners/` |
| Entity pages | `src/app/[tenantDomain]/[locale]/[branchSlug]/entity/` |
| Custom pages | `src/app/[tenantDomain]/[locale]/[branchSlug]/p/[pageSlug]/page.tsx` |
| Careers | `src/app/[tenantDomain]/[locale]/careers/` |
| Profile | `src/app/[tenantDomain]/[locale]/profile/` |
| Legal pages | `src/app/[tenantDomain]/[locale]/polityka-prywatnosci/`, `regulamin/` |
| Customer login/register | `src/app/[tenantDomain]/[locale]/login/`, `register/` |
| Public widgets | `src/widgets/` (About/, Article/, BranchCrossLink/, Catalog/, Checkout/, Footer/, Gallery/, Hero/, Menu/, Navbar/, Sections/) |

---

## 8. Dynamic Locale System

GoPublica uses a **tenant-selected locales** architecture. Each tenant chooses which locales are active for content translation.

### 8.1 Global Locale Catalog

A single source of truth for all supported locales exists in three locations (must stay in sync):

| Package | File | Export |
|---------|------|--------|
| **backend** | `config/locales.js` | `GLOBAL_LOCALES`, `LOCALE_CODES`, `getLabelForLocale()`, `isValidLocale()` |
| **gopublica-core** | `src/shared/lib/locales.ts` | Same exports as TypeScript constants + `LANGUAGE_NAMES` |
| **frontend-next** | `src/shared/lib/locales.ts` | Same exports as TypeScript constants + `LANGUAGE_NAMES` |

Supported locales: `pl` 🇵🇱, `en` 🇬🇧, `de` 🇩🇪, `ru` 🇷🇺, `ua` 🇺🇦, `es` 🇪🇸

**Important**: Ukrainian is always `ua` (ISO 639-1), never `uk`.

### 8.2 TenantSettings Locale Fields

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `activeLocales` | `[String]` | `['pl', 'en']` | Locales this tenant has enabled. Admin forms render tabs only for these. |
| `defaultLocale` | `String` | `'pl'` | Primary / fallback locale. Must be one of `activeLocales`. |
| `primaryLanguage` | `String` | `'pl'` | **Deprecated** — kept for backward compat. Use `defaultLocale` instead. |

### 8.3 Frontend Context Flow

```
TenantSettings API → normalizeTenantData() → SiteConfig.activeLocales/defaultLocale
                                                      │
                              ┌────────────────────────┘
                              ▼
                       TenantContext (useTenant())
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                  ▼
    SectionForm        MenuManager         JobsSettings
    (reads .activeLocales, .defaultLocale)
```

### 8.4 Translation Data Pattern

All translation data uses `Map<String>` or `Mixed` in Mongoose — keys are **freeform locale codes**, not hardcoded. Examples:

- `MenuItem.translations` = `Map<lang, { name, description }>`
- `CategoryTranslation.translations` = `Map<String>`
- `BranchSection.translations` = `Mixed` (freeform)
- `PlatformProduct.titleI18n` = `Map<String>`

### 8.5 Shared UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `TranslatableInput` | `gopublica-core/src/shared/ui/TranslatableInput.tsx` | Single translation field with locale tabs |
| `TranslatableGroup` | `gopublica-core/src/shared/ui/TranslatableGroup.tsx` | Multiple sub-fields per locale in a tabbed grid |

### 8.6 Navigation Configuration (TenantSettings.navigation)

Tenants can customize which links appear in the desktop Navbar and how they're grouped.

**Data model** (`TenantSettings.navigation`):
- `items[]` — Array of nav items, each with: `id` (UUID), `type` (home/system/custom/external), `slug`, `label` (optional override), `isVisible`, `placement` (primary/dropdown), `order`
- `dropdownLabel` — Optional override for the "More" button text

**System page catalog** (canonical list in `gopublica-core/src/shared/lib/navigation.ts` → `SYSTEM_PAGES`):

| Slug | Feature Flag | i18n Key |
|------|-------------|----------|
| `home` | — | `nav.home` |
| `menu` | `hasMenu` | `nav.menu` |
| `catalog` | `hasOnlineOrdering` | `nav.catalog` |
| `gallery` | `hasGallery` | `nav.gallery` |
| `partners` | — | `nav.partners` |
| `contacts` | — | `nav.contact` |
| `articles` | — | `nav.articles` |
| `reservations` | `hasBooking` | `nav.booking` |

**Backwards compatibility**: When `navigation.items` is empty or absent, the Navbar falls back to the original hardcoded link construction based on feature flags.

**Admin UI**: Settings page → "Navigation" tab → drag-and-drop reordering between "Main Menu" (primary) and "More Dropdown" (secondary) zones. Uses `@dnd-kit`.

**Storefront flow**: `getNavLinks()` in `shared/lib/navigation.ts` resolves the config into `{ primary, dropdown }` arrays. `Navbar.tsx` renders primary links inline and secondary links via `NavMoreDropdown.tsx`. `Footer.tsx` renders all visible links via `getAllVisibleNavLinks()`.

---

## Appendix: Backend Services Reference

| Service Directory | Files | Purpose |
|-------------------|-------|---------|
| `services/booking/` | — | Booking-related business logic |
| `services/consent/` | — | GDPR consent processing |
| `services/content/` | — | Article/event content logic |
| `services/external/` | — | External API integrations (Furgonetka, etc.) |
| `services/hr/` | — | Job application processing |
| `services/notifications/` | `tenantTelegram.js` + others | Telegram bot + push notification logic |
| `services/payments/` | — | Stripe payment processing helpers |
| `services/platform/` | — | Platform marketplace logic |
| `services/tenant/` | — | Tenant provisioning and management |
| `services/validation/` | — | Input validation helpers |

## Appendix: Backend Scripts Reference

| Directory | Purpose |
|-----------|---------|
| `scripts/migrations/` | Database migration scripts |
| `scripts/seed/` | Database seeding scripts |
| `scripts/utilities/` | Utility scripts |

## Appendix: Static Frontend Serving

After all API routes, the backend serves the React/Next.js build from `../frontend/dist`:
- Static files via `express.static()`
- SPA fallback: `GET /^(?!\/api\/).*$/` → `index.html`
- 404 JSON handler for unmatched `/api/*` routes
- Global error handler: JSON response for API, pass-through for frontend
