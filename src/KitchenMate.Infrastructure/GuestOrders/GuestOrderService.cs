using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Interfaces;
using KitchenMate.Domain;
using KitchenMate.Domain.Entities;
using KitchenMate.Domain.Enums;
using KitchenMate.Infrastructure.Persistence;
using KitchenMate.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Stripe;

namespace KitchenMate.Infrastructure.GuestOrders;

public class GuestOrderService(
    ApplicationDbContext db,
    IHttpContextAccessor httpContextAccessor,
    IConfiguration configuration,
    IHostEnvironment environment) : IGuestOrderService
{
    public async Task<GuestMenuDto> GetMenuAsync(string tenantSlug, string tableNumber, CancellationToken ct = default)
    {
        var (tenant, table) = await ResolveTableAsync(tenantSlug, tableNumber, ct);

        var categories = await db.MenuCategories
            .AsNoTracking()
            .Include(c => c.Items.Where(i => i.IsAvailable))
            .Where(c => c.TenantId == tenant.Id)
            .OrderBy(c => c.SortOrder)
            .ToListAsync(ct);

        var menu = categories.Select(c => new MenuCategoryDto(
            c.Id,
            c.Name,
            c.SortOrder,
            c.Items.OrderBy(i => i.Name).Select(i => new MenuItemDto(
                i.Id, i.CategoryId, i.Name, i.Description, i.Price, i.CookTimeMinutes, i.IsAvailable)).ToList())).ToList();

        return new GuestMenuDto(tenant.Name, table.Number, menu);
    }

    public async Task<GuestOrderDto?> GetUnpaidOrderAsync(string tenantSlug, string tableNumber, CancellationToken ct = default)
    {
        var (tenant, table) = await ResolveTableAsync(tenantSlug, tableNumber, ct);
        var order = await GetUnpaidGuestOrderAsync(table.Id, ct);
        return order is null ? null : MapGuest(order, tenant.Name);
    }

    public async Task<GuestOrderDto> SyncUnpaidOrderAsync(
        string tenantSlug,
        string tableNumber,
        SyncGuestOrderRequest request,
        CancellationToken ct = default)
    {
        if (request.Items.Count == 0)
            throw new BusinessRuleException("Add at least one item to your order.");

        var (tenant, table) = await ResolveTableAsync(tenantSlug, tableNumber, ct);
        var menuItems = await LoadMenuItems(request.Items, ct);

        var order = await GetUnpaidGuestOrderAsync(table.Id, ct);
        if (order is null)
        {
            order = new Order
            {
                TenantId = tenant.Id,
                OrderNumber = await GenerateOrderNumberAsync(tenant.Id, ct),
                Type = OrderType.DineIn,
                TableId = table.Id,
                Status = OrderStatus.Placed,
                IsGuestOrder = true,
                PaymentStatus = PaymentStatus.Unpaid,
                Notes = request.Notes
            };
            db.Orders.Add(order);

            if (table.Status == TableStatus.Available)
            {
                table.Status = TableStatus.Occupied;
                table.UpdatedAt = DateTime.UtcNow;
            }
        }
        else
        {
            order.Notes = request.Notes;
            order.UpdatedAt = DateTime.UtcNow;
            if (order.Status != OrderStatus.Placed)
                order.Status = OrderStatus.Placed;
            db.OrderItems.RemoveRange(order.Items);
        }

        order.Items = request.Items.Select(req =>
        {
            var menu = menuItems[req.MenuItemId];
            return new OrderItem
            {
                OrderId = order.Id,
                MenuItemId = menu.Id,
                MenuItemName = menu.Name,
                Quantity = req.Quantity,
                UnitPrice = menu.Price,
                CookTimeMinutes = menu.CookTimeMinutes
            };
        }).ToList();

        await db.SaveChangesAsync(ct);

        order = await db.Orders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .FirstAsync(o => o.Id == order.Id, ct);

        return MapGuest(order, tenant.Name);
    }

    public async Task<GuestPaymentIntentDto> CreatePaymentAsync(string tenantSlug, string tableNumber, CancellationToken ct = default)
    {
        var (_, table) = await ResolveTableAsync(tenantSlug, tableNumber, ct);
        var order = await GetUnpaidGuestOrderAsync(table.Id, ct)
            ?? throw new BusinessRuleException("No open order to pay.");

        if (order.Items.Count == 0)
            throw new BusinessRuleException("Add items before paying.");

        var secretKey = configuration["Stripe:SecretKey"];
        if (string.IsNullOrWhiteSpace(secretKey))
        {
            return new GuestPaymentIntentDto(string.Empty, order.Id, order.Total, DemoMode: true);
        }

        StripeConfiguration.ApiKey = secretKey;

        var service = new PaymentIntentService();
        var intent = await service.CreateAsync(new PaymentIntentCreateOptions
        {
            Amount = ToStripeAmount(order.Total),
            Currency = "usd",
            Metadata = new Dictionary<string, string>
            {
                ["orderId"] = order.Id.ToString(),
                ["tenantSlug"] = tenantSlug,
                ["tableNumber"] = tableNumber
            }
        }, cancellationToken: ct);

        order.StripePaymentIntentId = intent.Id;
        order.PaymentStatus = PaymentStatus.Pending;
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return new GuestPaymentIntentDto(intent.ClientSecret, order.Id, order.Total, DemoMode: false);
    }

    public async Task<GuestOrderDto> ConfirmPaymentAsync(
        string tenantSlug,
        string tableNumber,
        ConfirmGuestPaymentRequest request,
        CancellationToken ct = default)
    {
        var (tenant, table) = await ResolveTableAsync(tenantSlug, tableNumber, ct);
        var order = await GetUnpaidGuestOrderAsync(table.Id, ct)
            ?? throw new BusinessRuleException("No open order to confirm.");

        var secretKey = configuration["Stripe:SecretKey"]
            ?? throw new BusinessRuleException("Stripe is not configured.");

        StripeConfiguration.ApiKey = secretKey;

        var service = new PaymentIntentService();
        var intent = await service.GetAsync(request.PaymentIntentId, cancellationToken: ct);

        if (intent.Status != "succeeded")
            throw new BusinessRuleException("Payment has not completed yet.");

        if (order.StripePaymentIntentId != intent.Id)
            throw new BusinessRuleException("Payment does not match this order.");

        return await MarkPaidAsync(order, tenant.Name, ct);
    }

    public async Task<GuestOrderDto> DemoPayAsync(string tenantSlug, string tableNumber, CancellationToken ct = default)
    {
        if (!environment.IsDevelopment())
            throw new BusinessRuleException("Demo payment is only available in development.");

        var (tenant, table) = await ResolveTableAsync(tenantSlug, tableNumber, ct);
        var order = await GetUnpaidGuestOrderAsync(table.Id, ct)
            ?? throw new BusinessRuleException("No open order to pay.");

        return await MarkPaidAsync(order, tenant.Name, ct);
    }

    private async Task<GuestOrderDto> MarkPaidAsync(Order order, string restaurantName, CancellationToken ct)
    {
        order.PaymentStatus = PaymentStatus.Paid;
        order.PaidAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        order = await db.Orders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .FirstAsync(o => o.Id == order.Id, ct);

        return MapGuest(order, restaurantName);
    }

    private async Task<(Tenant tenant, DiningTable table)> ResolveTableAsync(
        string tenantSlug,
        string tableNumber,
        CancellationToken ct)
    {
        var slug = tenantSlug.Trim().ToLowerInvariant();
        var tenant = await db.Tenants.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Slug == slug && t.IsActive, ct)
            ?? throw new BusinessRuleException("Restaurant not found.");

        if (httpContextAccessor.HttpContext is not null)
            TenantContext.SetTenantId(httpContextAccessor.HttpContext, tenant.Id);

        var table = await db.Tables
            .FirstOrDefaultAsync(t => t.TenantId == tenant.Id && t.Number == tableNumber, ct)
            ?? throw new BusinessRuleException("Table not found.");

        return (tenant, table);
    }

    private Task<Order?> GetUnpaidGuestOrderAsync(Guid tableId, CancellationToken ct) =>
        db.Orders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .FirstOrDefaultAsync(o =>
                o.TableId == tableId &&
                o.IsGuestOrder &&
                (o.PaymentStatus == PaymentStatus.Unpaid || o.PaymentStatus == PaymentStatus.Pending) &&
                o.Status != OrderStatus.Completed &&
                o.Status != OrderStatus.Cancelled, ct);

    private async Task<Dictionary<Guid, MenuItem>> LoadMenuItems(
        IReadOnlyList<GuestOrderItemRequest> items,
        CancellationToken ct)
    {
        foreach (var item in items)
        {
            if (item.Quantity < 1)
                throw new BusinessRuleException("Item quantity must be at least 1.");
        }

        var ids = items.Select(i => i.MenuItemId).Distinct().ToList();
        var menuItems = await db.MenuItems.Where(m => ids.Contains(m.Id) && m.IsAvailable).ToListAsync(ct);

        if (menuItems.Count != ids.Count)
            throw new BusinessRuleException("One or more menu items are unavailable.");

        return menuItems.ToDictionary(m => m.Id);
    }

    private async Task<string> GenerateOrderNumberAsync(Guid tenantId, CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var count = await db.Orders.IgnoreQueryFilters()
            .CountAsync(o => o.TenantId == tenantId && o.CreatedAt >= today, ct);
        return $"ORD-{today:yyyyMMdd}-{(count + 1):D4}";
    }

    private static long ToStripeAmount(decimal total) => (long)Math.Round(total * 100m, MidpointRounding.AwayFromZero);

    private static GuestOrderDto MapGuest(Order o, string restaurantName) =>
        new(
            o.Id,
            o.OrderNumber,
            o.Table?.Number ?? string.Empty,
            restaurantName,
            o.Status,
            o.PaymentStatus,
            o.Total,
            CookTimeRules.EstimateOrderMinutes(o.Items.Select(i => i.CookTimeMinutes)),
            o.Notes,
            o.Items.Select(i => new OrderItemDto(
                i.Id, i.MenuItemId, i.MenuItemName, i.Quantity, i.UnitPrice, i.CookTimeMinutes, i.Notes, i.LineTotal)).ToList());
}
