using KitchenMate.Domain.Entities;
using KitchenMate.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace KitchenMate.Infrastructure.Persistence;

public static class SeedData
{
    public static async Task InitializeAsync(ApplicationDbContext db)
    {
        await db.Database.MigrateAsync();
        await SeedMenuAndTablesAsync(db);
    }

    public static async Task SeedSampleOrdersAsync(ApplicationDbContext db, string? waiterUserId)
    {
        if (await db.Orders.AnyAsync())
            return;

        var items = await db.MenuItems.AsNoTracking().ToDictionaryAsync(i => i.Name);
        var tables = await db.Tables.ToDictionaryAsync(t => t.Number);

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
                        UnitPrice = menu.Price
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
            OrderNumber = $"ORD-{now:yyyyMMdd}-0002",
            Type = OrderType.DineIn,
            Status = OrderStatus.InKitchen,
            TableId = tables["3"].Id,
            CreatedByUserId = waiterUserId,
            CreatedAt = now.AddMinutes(-25)
        }, ("Beef Burger", 2), ("Soft Drink", 2)));

        Add(TryOrder(new Order
        {
            OrderNumber = $"ORD-{now:yyyyMMdd}-0003",
            Type = OrderType.Takeaway,
            Status = OrderStatus.Ready,
            Notes = "Pickup for Alex",
            CreatedByUserId = waiterUserId,
            CreatedAt = now.AddMinutes(-35)
        }, ("Vegetable Pasta", 1), ("Fresh Juice", 1)));

        Add(TryOrder(new Order
        {
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
            OrderNumber = $"ORD-{now.AddDays(-1):yyyyMMdd}-0002",
            Type = OrderType.Takeaway,
            Status = OrderStatus.Completed,
            CreatedByUserId = waiterUserId,
            CreatedAt = now.AddDays(-1).AddHours(-4)
        }, ("Beef Burger", 1), ("Chocolate Cake", 1), ("Soft Drink", 1)));

        Add(TryOrder(new Order
        {
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

    private static async Task SeedMenuAndTablesAsync(ApplicationDbContext db)
    {
        if (await db.MenuCategories.AnyAsync())
            return;

        var appetizers = new MenuCategory { Name = "Appetizers", SortOrder = 1 };
        var mains = new MenuCategory { Name = "Main Courses", SortOrder = 2 };
        var desserts = new MenuCategory { Name = "Desserts", SortOrder = 3 };
        var drinks = new MenuCategory { Name = "Drinks", SortOrder = 4 };

        db.MenuCategories.AddRange(appetizers, mains, desserts, drinks);

        db.MenuItems.AddRange(
            new MenuItem { Category = appetizers, Name = "Spring Rolls", Description = "Crispy vegetable rolls", Price = 6.50m },
            new MenuItem { Category = appetizers, Name = "Soup of the Day", Description = "Chef's daily selection", Price = 5.00m },
            new MenuItem { Category = appetizers, Name = "Garlic Bread", Description = "Toasted with herb butter", Price = 4.50m },
            new MenuItem { Category = appetizers, Name = "Caesar Salad", Description = "Romaine, parmesan, croutons", Price = 8.00m },
            new MenuItem { Category = mains, Name = "Grilled Chicken", Description = "Served with rice and salad", Price = 14.99m },
            new MenuItem { Category = mains, Name = "Beef Burger", Description = "Angus beef with fries", Price = 12.50m },
            new MenuItem { Category = mains, Name = "Vegetable Pasta", Description = "Seasonal vegetables in tomato sauce", Price = 11.00m },
            new MenuItem { Category = mains, Name = "Fish & Chips", Description = "Beer-battered cod with tartar sauce", Price = 13.50m },
            new MenuItem { Category = desserts, Name = "Chocolate Cake", Description = "Warm slice with vanilla cream", Price = 6.00m },
            new MenuItem { Category = desserts, Name = "Ice Cream Scoop", Description = "Vanilla, chocolate, or strawberry", Price = 3.50m },
            new MenuItem { Category = drinks, Name = "Soft Drink", Price = 2.50m },
            new MenuItem { Category = drinks, Name = "Fresh Juice", Price = 4.00m },
            new MenuItem { Category = drinks, Name = "Coffee", Price = 3.00m },
            new MenuItem { Category = drinks, Name = "Iced Tea", Price = 3.50m }
        );

        for (var i = 1; i <= 10; i++)
        {
            db.Tables.Add(new DiningTable
            {
                Number = i.ToString(),
                Capacity = i <= 4 ? 2 : i <= 8 ? 4 : 6,
                Status = TableStatus.Available
            });
        }

        await db.SaveChangesAsync();
    }
}
