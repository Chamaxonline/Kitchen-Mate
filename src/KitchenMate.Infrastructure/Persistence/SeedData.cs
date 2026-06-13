using KitchenMate.Domain.Constants;
using KitchenMate.Domain.Entities;
using KitchenMate.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace KitchenMate.Infrastructure.Persistence;

public static class SeedData
{
    public static async Task<Tenant> InitializeAsync(ApplicationDbContext db)
    {
        await db.Database.MigrateAsync();
        return await EnsureDemoTenantAsync(db);
    }

    public static async Task SeedSampleOrdersAsync(ApplicationDbContext db, Guid tenantId, string? waiterUserId)
    {
        if (await db.Orders.IgnoreQueryFilters().AnyAsync(o => o.TenantId == tenantId))
            return;

        var items = await db.MenuItems.IgnoreQueryFilters()
            .Where(i => i.TenantId == tenantId)
            .AsNoTracking()
            .ToDictionaryAsync(i => i.Name);
        var tables = await db.Tables.IgnoreQueryFilters()
            .Where(t => t.TenantId == tenantId)
            .ToDictionaryAsync(t => t.Number);

        if (items.Count == 0 || tables.Count == 0)
            return;

        List<OrderItem> Lines(params (string Name, int Qty)[] lines) =>
            lines
                .Where(l => items.ContainsKey(l.Name))
                .Select(l =>
                {
                    var menu = items[l.Name];
                    return new OrderItem
                    {
                        MenuItemId = menu.Id,
                        MenuItemName = menu.Name,
                        Quantity = l.Qty,
                        UnitPrice = menu.Price,
                        CookTimeMinutes = menu.CookTimeMinutes
                    };
                })
                .ToList();

        Order? TryOrder(Order order, params (string Name, int Qty)[] lines)
        {
            var orderItems = Lines(lines);
            if (orderItems.Count == 0) return null;
            order.Items = orderItems;
            return order;
        }

        var now = DateTime.UtcNow;
        var orders = new List<Order>();

        void Add(Order? order)
        {
            if (order is not null) orders.Add(order);
        }

        Add(TryOrder(new Order
        {
            TenantId = tenantId,
            OrderNumber = $"ORD-{now:yyyyMMdd}-0001",
            Type = OrderType.DineIn,
            Status = OrderStatus.SentToKitchen,
            TableId = tables["1"].Id,
            Notes = "No spice on spring rolls",
            CreatedByUserId = waiterUserId,
            CreatedAt = now.AddMinutes(-12)
        }, ("Spring Rolls", 2), ("Grilled Chicken", 1)));

        Add(TryOrder(new Order
        {
            TenantId = tenantId,
            OrderNumber = $"ORD-{now:yyyyMMdd}-0002",
            Type = OrderType.DineIn,
            Status = OrderStatus.InKitchen,
            TableId = tables["3"].Id,
            CreatedByUserId = waiterUserId,
            CreatedAt = now.AddMinutes(-25)
        }, ("Beef Burger", 2), ("Soft Drink", 2)));

        Add(TryOrder(new Order
        {
            TenantId = tenantId,
            OrderNumber = $"ORD-{now:yyyyMMdd}-0003",
            Type = OrderType.Takeaway,
            Status = OrderStatus.Ready,
            Notes = "Pickup for Alex",
            CreatedByUserId = waiterUserId,
            CreatedAt = now.AddMinutes(-35)
        }, ("Vegetable Pasta", 1), ("Fresh Juice", 1)));

        Add(TryOrder(new Order
        {
            TenantId = tenantId,
            OrderNumber = $"ORD-{now.AddDays(-1):yyyyMMdd}-0001",
            Type = OrderType.DineIn,
            Status = OrderStatus.Completed,
            TableId = tables["5"].Id,
            CreatedByUserId = waiterUserId,
            CreatedAt = now.AddDays(-1).AddHours(-2)
        }, ("Fish & Chips", 2), ("Caesar Salad", 1), ("Iced Tea", 2),
           ("Grilled Chicken", 2), ("Spring Rolls", 1), ("Soft Drink", 2)));

        Add(TryOrder(new Order
        {
            TenantId = tenantId,
            OrderNumber = $"ORD-{now.AddDays(-1):yyyyMMdd}-0002",
            Type = OrderType.Takeaway,
            Status = OrderStatus.Completed,
            CreatedByUserId = waiterUserId,
            CreatedAt = now.AddDays(-1).AddHours(-4)
        }, ("Beef Burger", 1), ("Chocolate Cake", 1), ("Soft Drink", 1)));

        Add(TryOrder(new Order
        {
            TenantId = tenantId,
            OrderNumber = $"ORD-{now.AddDays(-2):yyyyMMdd}-0001",
            Type = OrderType.DineIn,
            Status = OrderStatus.Cancelled,
            TableId = tables["7"].Id,
            Notes = "Guest left before order was served",
            CreatedByUserId = waiterUserId,
            CreatedAt = now.AddDays(-2)
        }, ("Soup of the Day", 2)));

        if (orders.Count == 0)
            return;

        db.Orders.AddRange(orders);

        tables["1"].Status = TableStatus.Occupied;
        tables["3"].Status = TableStatus.Occupied;

        await db.SaveChangesAsync();
    }

    private static async Task<Tenant> EnsureDemoTenantAsync(ApplicationDbContext db)
    {
        var tenant = await db.Tenants.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Slug == TenantConstants.DemoSlug);

        if (tenant is null)
        {
            tenant = new Tenant
            {
                Name = TenantConstants.DemoName,
                Slug = TenantConstants.DemoSlug,
                IsActive = true
            };
            db.Tenants.Add(tenant);
            await db.SaveChangesAsync();
        }

        await TenantSeedHelper.SeedMenuAndTablesAsync(db, tenant.Id);
        return tenant;
    }
}
