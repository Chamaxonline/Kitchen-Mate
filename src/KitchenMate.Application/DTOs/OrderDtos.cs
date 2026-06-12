using KitchenMate.Domain.Enums;

namespace KitchenMate.Application.DTOs;

public record OrderItemDto(
    Guid Id,
    Guid MenuItemId,
    string MenuItemName,
    int Quantity,
    decimal UnitPrice,
    string? Notes,
    decimal LineTotal);

public record OrderDto(
    Guid Id,
    string OrderNumber,
    OrderType Type,
    OrderStatus Status,
    Guid? TableId,
    string? TableNumber,
    string? Notes,
    decimal Total,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    IReadOnlyList<OrderItemDto> Items);

public record CreateOrderItemRequest(Guid MenuItemId, int Quantity, string? Notes);

public record CreateOrderRequest(
    OrderType Type,
    Guid? TableId,
    string? Notes,
    IReadOnlyList<CreateOrderItemRequest> Items);

public record UpdateOrderStatusRequest(OrderStatus Status);
