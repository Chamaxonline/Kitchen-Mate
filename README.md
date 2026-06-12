# Kitchen Mate

Restaurant management system for order entry, kitchen workflow, and table management.

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

On first run, seed data loads sample menu items and 10 tables.

## Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `frontend/.env.local.example` to `frontend/.env.local` if the API is not on `http://localhost:5257`.

## API overview

| Endpoint | Description |
|----------|-------------|
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

## Repository

https://github.com/Chamaxonline/Kitchen-Mate
