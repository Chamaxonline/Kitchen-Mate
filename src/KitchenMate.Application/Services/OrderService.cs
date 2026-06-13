using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Interfaces;
using KitchenMate.Domain;
using KitchenMate.Domain.Entities;
using KitchenMate.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace KitchenMate.Application.Services;

public class OrderService(IAppDbContext db)
{
    public async Task<OrderDto> CreateAsync(CreateOrderRequest request, string? userId, CancellationToken ct = default)
    {
        ValidateOrderRequest(request);

        if (request.Type == OrderType.DineIn)
        {
            var table = await db.Tables.FirstOrDefaultAsync(t => t.Id == request.TableId, ct)
                ?? throw new BusinessRuleException("Table not found.");

            if (table.Status == TableStatus.Occupied)
                throw new BusinessRuleException($"Table {table.Number} is already occupied.");

            table.Status = TableStatus.Occupied;
            table.UpdatedAt = DateTime.UtcNow;
        }

        var menuItems = await LoadAndValidateMenuItems(request.Items, ct);

        var order = new Order
        {
            OrderNumber = await GenerateOrderNumberAsync(ct),
            Type = request.Type,
            TableId = request.Type == OrderType.DineIn ? request.TableId : null,
            Notes = request.Notes,
            CreatedByUserId = userId,
            Status = OrderStatus.SentToKitchen,
            Items = request.Items.Select(req =>
            {
                var menu = menuItems[req.MenuItemId];
                return new OrderItem
                {
                    MenuItemId = menu.Id,
                    MenuItemName = menu.Name,
                    Quantity = req.Quantity,
                    UnitPrice = menu.Price,
                    CookTimeMinutes = menu.CookTimeMinutes,
                    Notes = req.Notes
                };
            }).ToList()
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);

        return await GetByIdAsync(order.Id, ct) ?? throw new InvalidOperationException("Order not found after create.");
    }

    public async Task<IReadOnlyList<OrderDto>> GetOrdersAsync(
        OrderStatus? status = null,
        OrderType? type = null,
        Guid? tableId = null,
        bool kitchenQueueOnly = false,
        CancellationToken ct = default)
    {
        var query = db.Orders.AsNoTracking()
            .Include(o => o.Table)
            .Include(o => o.Items)
            .AsQueryable();

        if (kitchenQueueOnly)
            query = query.Where(o => o.Status == OrderStatus.SentToKitchen || o.Status == OrderStatus.InKitchen);
        else if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);

        if (type.HasValue)
            query = query.Where(o => o.Type == type.Value);

        if (tableId.HasValue)
            query = query.Where(o => o.TableId == tableId.Value);

        var orders = await query.OrderBy(o => o.CreatedAt).ToListAsync(ct);
        return orders.Select(Map).ToList();
    }

    public async Task<OrderDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var order = await db.Orders.AsNoTracking()
            .Include(o => o.Table)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        return order is null ? null : Map(order);
    }

    public async Task<OrderDto> UpdateStatusAsync(Guid id, UpdateOrderStatusRequest request, CancellationToken ct = default)
    {
        var order = await db.Orders.Include(o => o.Table).FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new BusinessRuleException("Order not found.");

        if (!OrderStatusTransitions.CanTransition(order.Status, request.Status))
            throw new BusinessRuleException($"Cannot change order status from {order.Status} to {request.Status}.");

        order.Status = request.Status;
        order.UpdatedAt = DateTime.UtcNow;

        if (request.Status == OrderStatus.Completed && order.Type == OrderType.DineIn && order.Table is not null)
        {
            order.Table.Status = TableStatus.Available;
            order.Table.UpdatedAt = DateTime.UtcNow;
        }

        if (request.Status == OrderStatus.Cancelled && order.Type == OrderType.DineIn && order.Table is not null)
        {
            var hasOtherActive = await db.Orders.AnyAsync(o =>
                o.TableId == order.TableId &&
                o.Id != order.Id &&
                o.Status != OrderStatus.Completed &&
                o.Status != OrderStatus.Cancelled, ct);

            if (!hasOtherActive)
            {
                order.Table.Status = TableStatus.Available;
                order.Table.UpdatedAt = DateTime.UtcNow;
            }
        }

        await db.SaveChangesAsync(ct);
        return (await GetByIdAsync(id, ct))!;
    }

    private static void ValidateOrderRequest(CreateOrderRequest request)
    {
        if (request.Items.Count == 0)
            throw new BusinessRuleException("Order must contain at least one item.");

        if (request.Type == OrderType.DineIn && request.TableId is null)
            throw new BusinessRuleException("Dine-in orders require a table.");

        if (request.Type == OrderType.Takeaway && request.TableId is not null)
            throw new BusinessRuleException("Takeaway orders cannot be assigned to a table.");

        foreach (var item in request.Items)
        {
            if (item.Quantity < 1)
                throw new BusinessRuleException("Item quantity must be at least 1.");
        }
    }

    private async Task<Dictionary<Guid, MenuItem>> LoadAndValidateMenuItems(
        IReadOnlyList<CreateOrderItemRequest> items,
        CancellationToken ct)
    {
        var ids = items.Select(i => i.MenuItemId).Distinct().ToList();
        var menuItems = await db.MenuItems.Where(m => ids.Contains(m.Id)).ToListAsync(ct);

        if (menuItems.Count != ids.Count)
            throw new BusinessRuleException("One or more menu items were not found.");

        var unavailable = menuItems.Where(m => !m.IsAvailable).Select(m => m.Name).ToList();
        if (unavailable.Count > 0)
            throw new BusinessRuleException($"Unavailable items: {string.Join(", ", unavailable)}");

        return menuItems.ToDictionary(m => m.Id);
    }

    private async Task<string> GenerateOrderNumberAsync(CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var count = await db.Orders.CountAsync(o => o.CreatedAt >= today, ct);
        return $"ORD-{today:yyyyMMdd}-{(count + 1):D4}";
    }

    private static DateTime AsUtc(DateTime value) =>
        value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };

    private static OrderDto Map(Order o) =>
        new(
            o.Id,
            o.OrderNumber,
            o.Type,
            o.Status,
            o.TableId,
            o.Table?.Number,
            o.Notes,
            o.Total,
            CookTimeRules.EstimateOrderMinutes(o.Items.Select(i => i.CookTimeMinutes)),
            AsUtc(o.CreatedAt),
            o.UpdatedAt is null ? null : AsUtc(o.UpdatedAt.Value),
            o.Items.Select(i => new OrderItemDto(
                i.Id, i.MenuItemId, i.MenuItemName, i.Quantity, i.UnitPrice, i.CookTimeMinutes, i.Notes, i.LineTotal)).ToList());
}
