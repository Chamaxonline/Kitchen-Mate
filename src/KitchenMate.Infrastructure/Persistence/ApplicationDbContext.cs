using KitchenMate.Application.Interfaces;
using KitchenMate.Domain.Entities;
using KitchenMate.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace KitchenMate.Infrastructure.Persistence;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser>(options), IAppDbContext
{
    public DbSet<DiningTable> Tables => Set<DiningTable>();
    public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<DiningTable>(e =>
        {
            e.HasIndex(t => t.Number).IsUnique();
            e.Property(t => t.Number).HasMaxLength(20);
        });

        modelBuilder.Entity<MenuCategory>(e =>
        {
            e.Property(c => c.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<MenuItem>(e =>
        {
            e.Property(m => m.Name).HasMaxLength(150);
            e.Property(m => m.Price).HasPrecision(10, 2);
            e.HasOne(m => m.Category).WithMany(c => c.Items).HasForeignKey(m => m.CategoryId);
        });

        modelBuilder.Entity<Order>(e =>
        {
            e.HasIndex(o => o.OrderNumber).IsUnique();
            e.Property(o => o.OrderNumber).HasMaxLength(30);
            e.HasOne(o => o.Table).WithMany(t => t.Orders).HasForeignKey(o => o.TableId);
        });

        modelBuilder.Entity<OrderItem>(e =>
        {
            e.Property(i => i.UnitPrice).HasPrecision(10, 2);
            e.Property(i => i.MenuItemName).HasMaxLength(150);
            e.HasOne(i => i.Order).WithMany(o => o.Items).HasForeignKey(i => i.OrderId);
            e.HasOne(i => i.MenuItem).WithMany().HasForeignKey(i => i.MenuItemId);
        });
    }
}
