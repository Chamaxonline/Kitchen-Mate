using KitchenMate.Application.Interfaces;
using KitchenMate.Domain.Entities;
using KitchenMate.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace KitchenMate.Infrastructure.Persistence;

public class ApplicationDbContext(
    DbContextOptions<ApplicationDbContext> options,
    ITenantContext tenantContext)
    : IdentityDbContext<ApplicationUser>(options), IAppDbContext
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<DiningTable> Tables => Set<DiningTable>();
    public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Tenant>(e =>
        {
            e.HasIndex(t => t.Slug).IsUnique();
            e.Property(t => t.Name).HasMaxLength(150);
            e.Property(t => t.Slug).HasMaxLength(50);
        });

        modelBuilder.Entity<ApplicationUser>(e =>
        {
            e.HasOne(u => u.Tenant).WithMany().HasForeignKey(u => u.TenantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DiningTable>(e =>
        {
            e.HasIndex(t => new { t.TenantId, t.Number }).IsUnique();
            e.Property(t => t.Number).HasMaxLength(20);
            e.HasOne(t => t.Tenant).WithMany().HasForeignKey(t => t.TenantId).OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(t => !tenantContext.HasTenant || t.TenantId == tenantContext.TenantId);
        });

        modelBuilder.Entity<MenuCategory>(e =>
        {
            e.Property(c => c.Name).HasMaxLength(100);
            e.HasOne(c => c.Tenant).WithMany().HasForeignKey(c => c.TenantId).OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(c => !tenantContext.HasTenant || c.TenantId == tenantContext.TenantId);
        });

        modelBuilder.Entity<MenuItem>(e =>
        {
            e.Property(m => m.Name).HasMaxLength(150);
            e.Property(m => m.Price).HasPrecision(10, 2);
            e.HasOne(m => m.Category).WithMany(c => c.Items).HasForeignKey(m => m.CategoryId);
            e.HasOne(m => m.Tenant).WithMany().HasForeignKey(m => m.TenantId).OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(m => !tenantContext.HasTenant || m.TenantId == tenantContext.TenantId);
        });

        modelBuilder.Entity<Order>(e =>
        {
            e.HasIndex(o => new { o.TenantId, o.OrderNumber }).IsUnique();
            e.Property(o => o.OrderNumber).HasMaxLength(30);
            e.Property(o => o.StripePaymentIntentId).HasMaxLength(100);
            e.HasOne(o => o.Table).WithMany(t => t.Orders).HasForeignKey(o => o.TableId);
            e.HasOne(o => o.Tenant).WithMany().HasForeignKey(o => o.TenantId).OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(o => !tenantContext.HasTenant || o.TenantId == tenantContext.TenantId);
        });

        modelBuilder.Entity<OrderItem>(e =>
        {
            e.Property(i => i.UnitPrice).HasPrecision(10, 2);
            e.Property(i => i.MenuItemName).HasMaxLength(150);
            e.HasOne(i => i.Order).WithMany(o => o.Items).HasForeignKey(i => i.OrderId);
            e.HasOne(i => i.MenuItem).WithMany().HasForeignKey(i => i.MenuItemId);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        if (tenantContext.TenantId is Guid tenantId)
        {
            foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
            {
                if (entry.State == EntityState.Added && entry.Entity.TenantId == Guid.Empty)
                    entry.Entity.TenantId = tenantId;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
