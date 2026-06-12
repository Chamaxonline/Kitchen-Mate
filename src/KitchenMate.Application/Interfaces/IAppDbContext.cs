using KitchenMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace KitchenMate.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<DiningTable> Tables { get; }
    DbSet<MenuCategory> MenuCategories { get; }
    DbSet<MenuItem> MenuItems { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
