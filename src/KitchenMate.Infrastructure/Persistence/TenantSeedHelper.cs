using KitchenMate.Domain.Entities;
using KitchenMate.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace KitchenMate.Infrastructure.Persistence;

public static class TenantSeedHelper
{
    public static async Task SeedMenuAndTablesAsync(ApplicationDbContext db, Guid tenantId, CancellationToken ct = default)
    {
        if (await db.MenuCategories.IgnoreQueryFilters().AnyAsync(c => c.TenantId == tenantId, ct))
            return;

        var appetizers = new MenuCategory { TenantId = tenantId, Name = "Appetizers", SortOrder = 1 };
        var mains = new MenuCategory { TenantId = tenantId, Name = "Main Courses", SortOrder = 2 };
        var desserts = new MenuCategory { TenantId = tenantId, Name = "Desserts", SortOrder = 3 };
        var drinks = new MenuCategory { TenantId = tenantId, Name = "Drinks", SortOrder = 4 };

        db.MenuCategories.AddRange(appetizers, mains, desserts, drinks);

        db.MenuItems.AddRange(
            new MenuItem { TenantId = tenantId, Category = appetizers, Name = "Spring Rolls", Description = "Crispy vegetable rolls", Price = 6.50m, CookTimeMinutes = 8 },
            new MenuItem { TenantId = tenantId, Category = appetizers, Name = "Soup of the Day", Description = "Chef's daily selection", Price = 5.00m, CookTimeMinutes = 12 },
            new MenuItem { TenantId = tenantId, Category = appetizers, Name = "Garlic Bread", Description = "Toasted with herb butter", Price = 4.50m, CookTimeMinutes = 6 },
            new MenuItem { TenantId = tenantId, Category = appetizers, Name = "Caesar Salad", Description = "Romaine, parmesan, croutons", Price = 8.00m, CookTimeMinutes = 5 },
            new MenuItem { TenantId = tenantId, Category = mains, Name = "Grilled Chicken", Description = "Served with rice and salad", Price = 14.99m, CookTimeMinutes = 18 },
            new MenuItem { TenantId = tenantId, Category = mains, Name = "Beef Burger", Description = "Angus beef with fries", Price = 12.50m, CookTimeMinutes = 15 },
            new MenuItem { TenantId = tenantId, Category = mains, Name = "Vegetable Pasta", Description = "Seasonal vegetables in tomato sauce", Price = 11.00m, CookTimeMinutes = 14 },
            new MenuItem { TenantId = tenantId, Category = mains, Name = "Fish & Chips", Description = "Beer-battered cod with tartar sauce", Price = 13.50m, CookTimeMinutes = 16 },
            new MenuItem { TenantId = tenantId, Category = desserts, Name = "Chocolate Cake", Description = "Warm slice with vanilla cream", Price = 6.00m, CookTimeMinutes = 5 },
            new MenuItem { TenantId = tenantId, Category = desserts, Name = "Ice Cream Scoop", Description = "Vanilla, chocolate, or strawberry", Price = 3.50m, CookTimeMinutes = 2 },
            new MenuItem { TenantId = tenantId, Category = drinks, Name = "Soft Drink", Price = 2.50m, CookTimeMinutes = 1 },
            new MenuItem { TenantId = tenantId, Category = drinks, Name = "Fresh Juice", Price = 4.00m, CookTimeMinutes = 3 },
            new MenuItem { TenantId = tenantId, Category = drinks, Name = "Coffee", Price = 3.00m, CookTimeMinutes = 4 },
            new MenuItem { TenantId = tenantId, Category = drinks, Name = "Iced Tea", Price = 3.50m, CookTimeMinutes = 2 }
        );

        for (var i = 1; i <= 10; i++)
        {
            db.Tables.Add(new DiningTable
            {
                TenantId = tenantId,
                Number = i.ToString(),
                Capacity = i <= 4 ? 2 : i <= 8 ? 4 : 6,
                Status = TableStatus.Available
            });
        }

        await db.SaveChangesAsync(ct);
    }
}
