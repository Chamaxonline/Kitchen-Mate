# Kitchen Mate

Multi-tenant restaurant management SaaS for order entry, kitchen workflow, and table management. Each restaurant gets an isolated workspace with its own menu, tables, orders, and staff.

## Stack

- **Backend:** ASP.NET Core 8 Web API, Entity Framework Core, SQL Server
- **Frontend:** Next.js (TypeScript, Tailwind CSS)
- **Docs:** [Product Requirements](docs/PRD.md)

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [SQL Server](https://www.microsoft.com/sql-server) (local or remote)
- [Node.js 20+](https://nodejs.org/) (for frontend)

## Backend setup

1. Copy local connection settings:

   ```powershell
   # appsettings.Development.json is gitignored — create it with your SQL credentials
   ```

   Example `src/KitchenMate.Api/appsettings.Development.json`:

   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=YOUR_SERVER;Database=KitchenMate;User Id=sa;Password=YOUR_PASSWORD;TrustServerCertificate=True"
     }
   }
   ```

2. Apply database migrations:

   ```powershell
   dotnet ef database update --project src/KitchenMate.Infrastructure --startup-project src/KitchenMate.Api
   ```

3. Run the API:

   ```powershell
   dotnet run --project src/KitchenMate.Api
   ```

4. Open Swagger: `https://localhost:7xxx/swagger` (see `launchSettings.json` for the port).

On first run, seed data loads:

- **14 menu items** across 4 categories (appetizers, mains, desserts, drinks)
- **10 tables**
- **4 demo users** (waiter, kitchen, manager, admin)
- **6 sample orders** covering the full workflow:
  - 2 in kitchen queue (new + in progress)
  - 1 ready for pickup (takeaway)
  - 2 completed (history)
  - 1 cancelled (history)

If your database already has menu data but no orders, sample orders are added automatically on the next API startup.

### Demo login accounts

| Email | Password | Role |
|-------|----------|------|
| waiter@kitchen.local | Password123! | Waiter |
| kitchen@kitchen.local | Password123! | Kitchen |
| manager@kitchen.local | Password123! | Manager |
| admin@kitchen.local | Password123! | Admin |

## Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `https://localhost:3000` if using HTTPS). Copy `frontend/.env.local.example` to `frontend/.env.local` and set `NEXT_PUBLIC_API_URL` to your API URL (default HTTPS profile: `https://localhost:7067`).

### SaaS — register a new restaurant

1. Open [http://localhost:3000/signup](http://localhost:3000/signup)
2. Enter restaurant name, workspace slug, and admin account details
3. You are signed in as **Admin** with a fresh menu (14 items) and 10 tables

Or use the demo tenant (`demo`) with the accounts below.

**API:** `POST /api/tenants/register` — creates tenant, admin user, and default menu/tables.

## API overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | Sign in (returns JWT) |
| `GET /api/auth/me` | Current user |
| `GET /api/menu` | Full menu with categories and items |
| `POST /api/menu/categories` | Create category |
| `PUT /api/menu/categories/{id}` | Update category |
| `DELETE /api/menu/categories/{id}` | Delete empty category |
| `GET /api/tables` | List tables |
| `GET /api/orders` | List orders (`?status=`, `?type=`, `?kitchenQueue=true`) |
| `POST /api/orders` | Place order (Dine-In or Takeaway) |
| `PATCH /api/orders/{id}/status` | Advance order status |

## Order flow

```
Placed → SentToKitchen → InKitchen → Ready → Completed
```

New orders are auto-sent to the kitchen on placement.

## CI / Deploy

- **CI:** GitHub Actions builds backend and frontend on every push to `main`.
- **Azure deploy:** Run the `Deploy API to Azure` workflow manually after adding these GitHub secrets:
  - `AZURE_WEBAPP_NAME`
  - `AZURE_WEBAPP_PUBLISH_PROFILE`
  - Set `ConnectionStrings__DefaultConnection` and `Jwt__Key` in Azure App Service configuration.

## Repository

https://github.com/Chamaxonline/Kitchen-Mate
