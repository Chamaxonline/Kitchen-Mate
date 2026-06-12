# Kitchen Mate — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** June 11, 2026  
**Status:** Draft

---

## 1. Overview

**Kitchen Mate** is a restaurant management system that helps staff take orders, route them to the kitchen, and track them until they are ready for service (dine-in) or pickup (takeaway).

### Goals

- Fast order entry from menu items
- Clear kitchen workflow (new → in progress → ready)
- Table assignment for dine-in orders
- Support dine-in and takeaway in one system

### Out of Scope (v1)

- Payments and billing
- Inventory / stock management
- Customer-facing online ordering
- Multi-branch / franchise support
- Reservations

---

## 2. Users & Roles

| Role | Description | Primary actions |
|------|-------------|-----------------|
| **Waiter / Server** | Front-of-house staff | Create orders, add menu items, assign tables, mark orders ready for service |
| **Kitchen Staff** | Back-of-house | View incoming orders, mark items/orders as in progress and ready |
| **Manager** | Supervises operations | Manage menu, tables, users; view all orders |
| **Admin** | System setup | Full access including configuration |

---

## 3. Core Features

### 3.1 Menu (existing data)

- Menu categories (e.g. Appetizers, Mains, Drinks)
- Menu items: name, description, price, availability, category
- Items can be marked unavailable without deleting them

### 3.2 Tables

- Tables have a number/label and capacity
- Status: **Available**, **Occupied**, **Reserved**
- Dine-in orders **must** be linked to a table
- Table becomes **Occupied** when an active dine-in order exists; **Available** when order is completed

### 3.3 Orders

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
| **SentToKitchen** | Order submitted to kitchen queue | Waiter (or auto on place) |
| **InKitchen** | Kitchen is preparing | Kitchen |
| **Ready** | Food ready — serve (dine-in) or pickup (takeaway) | Kitchen → Waiter |
| **Completed** | Order fulfilled and closed | Waiter |
| **Cancelled** | Order voided | Manager / Waiter |

#### Order items

- Each line: menu item, quantity, unit price (snapshot at order time), optional notes
- Line-level status optional in v1 (order-level status is sufficient)

### 3.4 Kitchen display

- Queue of orders in **SentToKitchen** and **InKitchen**
- Kitchen staff can move order to **InKitchen** and **Ready**
- Sort by time placed (FIFO)

### 3.5 Order entry (waiter)

1. Choose order type: Dine-In or Takeaway
2. If Dine-In → select table
3. Add items from menu (search/filter by category)
4. Review and place order → moves to kitchen
5. When kitchen marks **Ready** → waiter completes after serve/pickup

---

## 4. User Stories

### Waiter

- As a waiter, I want to create a dine-in order for a table so guests can be served.
- As a waiter, I want to create a takeaway order without a table.
- As a waiter, I want to add menu items to an order so the kitchen knows what to prepare.
- As a waiter, I want to see which orders are ready so I can serve or hand off pickup.

### Kitchen

- As kitchen staff, I want to see new orders as soon as they are placed.
- As kitchen staff, I want to mark orders as in progress and ready.

### Manager

- As a manager, I want to manage tables and menu items.
- As a manager, I want to view order history and active orders.

---

## 5. API Requirements (Backend — .NET Core)

### Resources

| Resource | Endpoints (summary) |
|----------|---------------------|
| Auth | Login, refresh token, current user |
| Menu | CRUD categories & items |
| Tables | List, create, update status |
| Orders | Create, list (filter by status/type/table), update status, cancel |
| Users | CRUD (manager/admin) |

### Key business rules

1. `DineIn` orders require `tableId`; `Takeaway` orders must not have a table.
2. Only **available** menu items can be added to new orders.
3. Status transitions must follow the defined workflow (no skipping except cancel).
4. Completing a dine-in order frees the table.
5. Prices on order lines are copied from menu at order time (historical accuracy).

---

## 6. Frontend Requirements (React / Next.js)

**Recommendation: Next.js (App Router)** — good for multiple views (waiter, kitchen, admin), API integration, and future mobile-friendly layouts.

### Screens (v1)

| Screen | Users | Purpose |
|--------|-------|---------|
| Login | All | Authentication |
| Dashboard | All | Role-based home |
| New Order | Waiter | Type, table, menu picker, cart |
| Active Orders | Waiter | Filter by status; complete ready orders |
| Kitchen Board | Kitchen | Kanban or list by status |
| Tables | Waiter/Manager | Table map / list |
| Menu Admin | Manager | Categories & items |
| Order History | Manager | Past orders |

### UX notes

- Large touch targets for kitchen and waiter tablets
- Real-time or near-real-time updates (polling in v1; SignalR in v2)
- Clear color coding for order status

---

## 7. Technical Stack

| Layer | Technology |
|-------|------------|
| Backend API | ASP.NET Core 8 Web API |
| ORM | Entity Framework Core |
| Database | SQL Server (or PostgreSQL) |
| Auth | JWT Bearer tokens |
| Frontend | Next.js 14+ (TypeScript), Tailwind CSS |
| API client | fetch / React Query |

### Solution structure (backend)

```
KitchenMate/
├── src/
│   ├── KitchenMate.Api/          # HTTP, controllers, DI
│   ├── KitchenMate.Application/  # Use cases, DTOs, validators
│   ├── KitchenMate.Domain/       # Entities, enums, interfaces
│   └── KitchenMate.Infrastructure/ # EF Core, repositories
├── tests/
└── docs/
```

---

## 8. Data Model (summary)

```
User          → Id, Email, Name, Role
Table         → Id, Number, Capacity, Status
MenuCategory  → Id, Name, SortOrder
MenuItem      → Id, CategoryId, Name, Price, IsAvailable
Order         → Id, Type (DineIn/Takeaway), TableId?, Status, CreatedAt, Notes
OrderItem     → Id, OrderId, MenuItemId, Quantity, UnitPrice, Notes
```

---

## 9. Non-Functional Requirements

- API response time &lt; 500ms for typical reads (local network)
- Role-based authorization on all endpoints
- Audit fields: `CreatedAt`, `UpdatedAt` on main entities
- Seed data: sample menu, tables, demo users for development

---

## 10. Milestones

| Phase | Deliverables |
|-------|----------------|
| **M1 — Foundation** | PRD, solution scaffold, DB schema, auth |
| **M2 — Core API** | Menu, tables, orders CRUD + status workflow |
| **M3 — Frontend MVP** | Login, new order, kitchen board, active orders |
| **M4 — Polish** | Menu/table admin, history, seed data, README |

---

## 11. Open Questions

1. Auto-send to kitchen on place, or explicit “Send to kitchen” action?
2. Modify order after sent to kitchen (add items only vs. locked)?
3. Single currency and tax line in v1?
4. Printer integration for kitchen tickets (future)?

**Default for v1:** Auto-send on place; no edits after SentToKitchen except cancel; no tax line.

---

## 12. Success Criteria

- Waiter can place dine-in and takeaway orders from the menu in under 2 minutes.
- Kitchen sees new orders within seconds of placement.
- Order status reflects kitchen progress through to ready and completed.
- Dine-in orders are always tied to a table; tables update correctly on complete.
