# Kitchen Mate — Product Requirements Document (PRD)

**Version:** 2.0  
**Date:** June 13, 2026  
**Status:** Implemented (MVP + SaaS)

---

## 1. Overview

**Kitchen Mate** is a **multi-tenant SaaS** restaurant management system. Each restaurant (tenant) gets an isolated workspace for order entry, kitchen workflow, table management, and staff onboarding.

Staff take orders, route them to the kitchen, and track them until they are ready for service (dine-in) or pickup (takeaway). Restaurant owners self-register; admins invite waiters, kitchen staff, and managers.

### Goals

- **SaaS onboarding** — self-service restaurant registration with default menu and tables
- **Tenant isolation** — each restaurant’s data is fully separated
- Fast order entry from menu items
- Clear kitchen workflow (queued → cooking → ready)
- Table assignment for dine-in orders
- Support dine-in and takeaway in one system
- **Team management** — invite staff by role within a restaurant
- **Operational dashboard** — daily orders, revenue, kitchen pipeline, table occupancy

### Out of Scope (current release)

- Subscription billing (Stripe) and plan limits
- Per-tenant custom domains / subdomains
- Payments and POS card processing
- Inventory / stock management
- Customer-facing online ordering
- Multi-branch / franchise (single location per tenant)
- Reservations
- Email invitations and password reset flows
- SignalR real-time updates (polling used in v1)
- User deactivation / delete

---

## 2. Tenancy & Onboarding

### 2.1 Tenant (restaurant workspace)

Each **tenant** represents one restaurant:

| Field | Description |
|-------|-------------|
| `Name` | Display name (e.g. Pizza Palace) |
| `Slug` | Unique URL identifier (e.g. `pizza-palace`) |
| `IsActive` | Whether the workspace is enabled |

On registration, the system automatically provisions:

- 4 menu categories and 14 sample menu items
- 10 tables (mixed capacities)
- One **Admin** user (the registrant)

### 2.2 Restaurant registration (SaaS signup)

**Actor:** New restaurant owner  
**Entry:** `/signup` or `POST /api/tenants/register`

1. Enter restaurant name and workspace slug
2. Enter admin full name, email, and password
3. System creates tenant, admin user, default menu/tables
4. User is signed in immediately with a JWT scoped to their tenant

**Business rules:**

- Slug: 3–50 chars, lowercase letters, numbers, hyphens only; globally unique
- Email: globally unique across the platform (one account per email)
- Password: min 8 chars, upper + lower + digit (ASP.NET Identity defaults)

### 2.3 Staff onboarding (team invite)

**Actor:** Admin or Manager  
**Entry:** `/team` or `POST /api/users`

Admins and managers invite staff by creating accounts (name, email, temporary password, role). Invited users sign in at `/login` — no separate signup.

| Inviter role | Can invite |
|--------------|------------|
| **Admin** | Waiter, Kitchen, Manager, Admin |
| **Manager** | Waiter, Kitchen only |

All invited users are bound to the **inviter’s tenant** and cannot access other restaurants.

### 2.4 Demo tenant

A seeded **Demo Restaurant** (`slug: demo`) ships with development data:

- 4 demo users (waiter, kitchen, manager, admin) — password `Password123!`
- Sample orders across workflow states

---

## 3. Users & Roles

| Role | Description | Primary actions |
|------|-------------|-----------------|
| **Waiter / Server** | Front-of-house staff | Create orders, assign tables, complete ready orders |
| **Kitchen Staff** | Back-of-house | Kitchen board; mark orders in progress and ready |
| **Manager** | Supervises operations | Menu admin, tables, order history, invite waiter/kitchen |
| **Admin** | Restaurant owner / setup | Full access; invite all roles; tenant administration |

**Authorization:** JWT Bearer tokens include `tenant_id`, `tenant_slug`, and `tenant_name` claims. All business data is filtered by tenant at the database layer.

---

## 4. Core Features

### 4.1 Dashboard

**Users:** All authenticated roles  
**Entry:** `/` (home)

At-a-glance operational metrics (refreshes every 10s + on tab focus):

| Metric | Description |
|--------|-------------|
| Orders today | Count since local midnight; breakdown dine-in / takeaway / completed |
| Revenue today | Sum of **completed** orders today; avg order value |
| Tables in use | Occupied vs total; free and reserved counts |
| Service load | Active orders in pipeline; ready-to-serve badge |
| Kitchen pipeline | Queued → Cooking → Ready bar and counts |
| Recent orders | Latest orders today (falls back to last 24h after midnight) |

### 4.2 Menu

- Menu categories (Appetizers, Mains, Desserts, Drinks)
- Menu items: name, description, price, availability, category
- Items can be marked unavailable without deleting them
- **Manager/Admin:** create categories and items via Menu Admin

### 4.3 Tables

- Tables have a number/label and capacity
- Status: **Available**, **Occupied**, **Reserved**
- Dine-in orders **must** be linked to a table
- Table becomes **Occupied** when an active dine-in order exists; **Available** when order is completed or cancelled (if no other active orders on that table)
- Table numbers are unique **per tenant** (not globally)

### 4.4 Orders

#### Order types

| Type | Table required | Flow after ready |
|------|----------------|------------------|
| **Dine-In** | Yes | Served to table |
| **Takeaway** | No | Customer pickup |

#### Order lifecycle (status)

```
Placed → SentToKitchen → InKitchen → Ready → Completed
                                              ↘ Cancelled (any stage before Completed)
```

| Status | Meaning | Who acts |
|--------|---------|----------|
| **Placed** | Order created, not yet sent to kitchen | Waiter |
| **SentToKitchen** | Order in kitchen queue | Auto on place |
| **InKitchen** | Kitchen is preparing | Kitchen |
| **Ready** | Food ready — serve or pickup | Kitchen → Waiter |
| **Completed** | Order fulfilled and closed | Waiter |
| **Cancelled** | Order voided | Manager / Waiter |

**v1 default:** Orders auto-send to kitchen on place (`SentToKitchen`). No edits after sent except cancel.

#### Order items

- Each line: menu item, quantity, unit price (snapshot at order time), optional notes
- Order-level status only (no per-line kitchen status in v1)

#### Order numbers

Format: `ORD-{yyyyMMdd}-{sequence}` — sequence is per tenant, per UTC day.

### 4.5 Kitchen display

- Kanban columns: **SentToKitchen**, **InKitchen**, **Ready**
- Kitchen staff advance status forward
- Auto-refresh every 10 seconds
- FIFO by `CreatedAt`

### 4.6 Order entry (waiter)

1. Choose order type: Dine-In or Takeaway
2. If Dine-In → select available table
3. Add items from menu (by category)
4. Place order → auto-sent to kitchen
5. When kitchen marks **Ready** → waiter completes after serve/pickup

### 4.7 Order history

- Completed and cancelled orders
- Sort by most recent first
- Filtered to current tenant

---

## 5. User Stories

### Restaurant owner (Admin)

- As an owner, I want to register my restaurant online so I can start using the system without manual setup.
- As an admin, I want to invite waiters and kitchen staff so my team can sign in and work.
- As an admin, I want to see today’s orders and revenue on a dashboard.

### Waiter

- As a waiter, I want to create dine-in and takeaway orders from the menu.
- As a waiter, I want to see which orders are ready so I can serve or hand off pickup.

### Kitchen

- As kitchen staff, I want to see new orders shortly after they are placed.
- As kitchen staff, I want to mark orders as in progress and ready.

### Manager

- As a manager, I want to manage menu items and table status.
- As a manager, I want to invite waiter and kitchen staff.
- As a manager, I want to view order history and the operational dashboard.

---

## 6. API Requirements (Backend — ASP.NET Core 8)

### Resources

| Resource | Endpoints | Auth |
|----------|-----------|------|
| **Tenants** | `POST /api/tenants/register`, `GET /api/tenants/current` | Register: anonymous; Current: authenticated |
| **Auth** | `POST /api/auth/login`, `GET /api/auth/me` | Login: anonymous; Me: authenticated |
| **Users** | `GET /api/users`, `POST /api/users` | Manager or Admin |
| **Menu** | `GET /api/menu`; CRUD categories/items | Read: authenticated; Write: Manager or Admin |
| **Tables** | `GET /api/tables`, `POST /api/tables`, `PATCH /api/tables/{id}/status` | Authenticated |
| **Orders** | `GET /api/orders` (filters), `POST /api/orders`, `PATCH /api/orders/{id}/status` | Authenticated |

### Order list filters

- `?status=` — filter by order status
- `?type=` — DineIn / Takeaway
- `?tableId=` — orders for a table
- `?kitchenQueue=true` — SentToKitchen + InKitchen only

### Key business rules

1. All queries are **tenant-scoped** via EF global query filters and JWT `tenant_id`.
2. `DineIn` orders require `tableId`; `Takeaway` orders must not have a table.
3. Only **available** menu items can be added to new orders.
4. Status transitions follow `OrderStatusTransitions` (no skipping except cancel).
5. Completing a dine-in order frees the table (if no other active orders).
6. Prices on order lines are copied from menu at order time.
7. Timestamps are stored in UTC and serialized with `Z` suffix.
8. User creation respects role hierarchy (Manager cannot create Admin/Manager).

---

## 7. Frontend Requirements (Next.js 15)

### Screens (implemented)

| Screen | Route | Users | Purpose |
|--------|-------|-------|---------|
| Signup | `/signup` | Public | Register new restaurant (SaaS) |
| Login | `/login` | Public | Staff authentication |
| Dashboard | `/` | All | Daily stats, kitchen pipeline, quick actions |
| New Order | `/orders/new` | Waiter+ | Type, table, menu picker, cart |
| Active Orders | `/orders` | Waiter+ | In-progress and ready orders |
| Kitchen Board | `/kitchen` | Kitchen+ | Kanban by status |
| Tables | `/tables` | All | Table list and status |
| Order History | `/orders/history` | All | Completed and cancelled |
| Menu Admin | `/menu` | Manager, Admin | Categories and items |
| Team | `/team` | Manager, Admin | Invite and list staff |

### UX (implemented)

- Sidebar navigation with restaurant name and slug
- Warm orange brand theme; card-based layout
- Lucide icons; shared UI primitives (Button, Card, PageHeader, EmptyState, LoadingState)
- Role badges for order status, table status, and user roles
- Demo account quick-pick on login page
- Polling for kitchen board, active orders, and dashboard (10–15s)
- Mobile-friendly header with sign-out on small screens

### UX (future)

- SignalR for instant kitchen updates
- Toast notifications
- Email invite links for staff

---

## 8. Technical Stack

| Layer | Technology |
|-------|------------|
| Backend API | ASP.NET Core 8 Web API |
| Architecture | Clean Architecture (Domain, Application, Infrastructure, Api) |
| ORM | Entity Framework Core 8 |
| Database | SQL Server |
| Auth | JWT Bearer + ASP.NET Identity Core |
| Multi-tenancy | Shared database, `TenantId` column + EF global query filters |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Icons | lucide-react |
| CI | GitHub Actions (build + tests) |
| Deploy | Azure Web App workflow template |

### Solution structure

```
KitchenMate/
├── src/
│   ├── KitchenMate.Api/           # Controllers, JWT, middleware
│   ├── KitchenMate.Application/   # Services, DTOs, interfaces
│   ├── KitchenMate.Domain/        # Entities, enums, transitions
│   └── KitchenMate.Infrastructure/ # EF Core, Identity, tenancy
├── frontend/                      # Next.js app
├── tests/
└── docs/
```

---

## 9. Data Model (summary)

```
Tenant        → Id, Name, Slug, IsActive, CreatedAt, UpdatedAt

User          → Id, TenantId, Email, FullName, Role (via Identity)
Table         → Id, TenantId, Number, Capacity, Status
MenuCategory  → Id, TenantId, Name, SortOrder
MenuItem      → Id, TenantId, CategoryId, Name, Price, IsAvailable
Order         → Id, TenantId, OrderNumber, Type, TableId?, Status, Notes, CreatedAt, UpdatedAt
OrderItem     → Id, OrderId, MenuItemId, Quantity, UnitPrice, Notes
```

**Uniqueness (per tenant):** `Table.Number`, `Order.OrderNumber`  
**Global uniqueness:** `Tenant.Slug`, `User.Email`

---

## 10. Non-Functional Requirements

- API response time &lt; 500ms for typical reads (local network)
- Role-based authorization on all endpoints
- Tenant isolation enforced at ORM layer (not only in controllers)
- Audit fields: `CreatedAt`, `UpdatedAt` on main entities
- UTC datetime serialization for API responses
- Seed data: demo tenant with menu, tables, users, and sample orders
- HTTPS CORS for local frontend (`localhost:3000` HTTP/HTTPS)

---

## 11. Milestones

| Phase | Status | Deliverables |
|-------|--------|--------------|
| **M1 — Foundation** | ✅ Done | PRD, solution scaffold, DB schema, JWT auth |
| **M2 — Core API** | ✅ Done | Menu, tables, orders CRUD + status workflow |
| **M3 — Frontend MVP** | ✅ Done | Login, new order, kitchen board, active orders |
| **M4 — Polish** | ✅ Done | Menu admin, history, seed data, README, CI |
| **M5 — UI & Dashboard** | ✅ Done | Sidebar layout, daily stats, kitchen pipeline |
| **M6 — SaaS Multi-tenancy** | ✅ Done | Tenant entity, registration, data isolation, signup UI |
| **M7 — Team management** | ✅ Done | Invite staff UI, role-based permissions |
| **M8 — SaaS billing** | 🔲 Planned | Stripe subscriptions, plan limits |
| **M9 — Real-time** | 🔲 Planned | SignalR kitchen updates |
| **M10 — Production** | 🔲 Planned | Custom domains, secrets, monitoring |

---

## 12. Open Questions

| # | Question | Decision |
|---|----------|----------|
| 1 | Auto-send to kitchen on place? | **Yes** — orders go to `SentToKitchen` on create |
| 2 | Edit order after sent to kitchen? | **No** in v1 — cancel only |
| 3 | Tax line in v1? | **No** — single currency (USD display) |
| 4 | Multi-tenant SaaS model? | **Yes** — shared DB, `TenantId` isolation |
| 5 | Staff self-signup? | **No** — admin/manager invites via Team page |
| 6 | Email globally unique? | **Yes** — one email, one tenant |
| 7 | Printer / kitchen tickets? | Deferred |
| 8 | Subscription billing? | Deferred (M8) |

---

## 13. Success Criteria

- A new restaurant owner can register, land on the dashboard, and place an order within 5 minutes.
- Admin can invite a waiter; waiter can sign in and see only their restaurant’s data.
- Waiter can place dine-in and takeaway orders from the menu in under 2 minutes.
- Kitchen sees new orders within seconds of placement (polling ≤ 10s).
- Order status reflects kitchen progress through to ready and completed.
- Dine-in orders are tied to a table; tables update correctly on complete.
- Dashboard shows accurate today’s order count and revenue for the tenant.
- Two restaurants on the same platform cannot see each other’s orders, menu, or users.
