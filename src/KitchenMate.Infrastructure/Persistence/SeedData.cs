using KitchenMate.Domain.Entities;
using KitchenMate.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace KitchenMate.Infrastructure.Persistence;

public static class SeedData
{
    public static async Task InitializeAsync(ApplicationDbContext db)
    {
        await db.Database.MigrateAsync();

        if (await db.MenuCategories.AnyAsync())
            return;

        var appetizers = new MenuCategory { Name = "Appetizers", SortOrder = 1 };
        var mains = new MenuCategory { Name = "Main Courses", SortOrder = 2 };
        var drinks = new MenuCategory { Name = "Drinks", SortOrder = 3 };

        db.MenuCategories.AddRange(appetizers, mains, drinks);

        db.MenuItems.AddRange(
            new MenuItem { Category = appetizers, Name = "Spring Rolls", Description = "Crispy vegetable rolls", Price = 6.50m },
            new MenuItem { Category = appetizers, Name = "Soup of the Day", Price = 5.00m },
            new MenuItem { Category = mains, Name = "Grilled Chicken", Description = "Served with rice and salad", Price = 14.99m },
            new MenuItem { Category = mains, Name = "Beef Burger", Description = "Angus beef with fries", Price = 12.50m },
            new MenuItem { Category = mains, Name = "Vegetable Pasta", Price = 11.00m },
            new MenuItem { Category = drinks, Name = "Soft Drink", Price = 2.50m },
            new MenuItem { Category = drinks, Name = "Fresh Juice", Price = 4.00m }
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
