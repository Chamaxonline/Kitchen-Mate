using KitchenMate.Domain.Enums;

namespace KitchenMate.Application.DTOs;

public record GuestOrderItemRequest(Guid MenuItemId, int Quantity);

public record SyncGuestOrderRequest(
    IReadOnlyList<GuestOrderItemRequest> Items,
    string? Notes);

public record GuestOrderDto(
    Guid Id,
    string OrderNumber,
    string TableNumber,
    string RestaurantName,
    OrderStatus Status,
    PaymentStatus PaymentStatus,
    decimal Total,
    int EstimatedCookMinutes,
    string? Notes,
    IReadOnlyList<OrderItemDto> Items);

public record GuestMenuDto(
    string RestaurantName,
    string TableNumber,
    IReadOnlyList<MenuCategoryDto> Categories);

public record GuestPaymentIntentDto(
    string ClientSecret,
    Guid OrderId,
    decimal Amount,
    bool DemoMode);

public record ConfirmGuestPaymentRequest(string PaymentIntentId);

public record DemoPayResponse(Guid OrderId, PaymentStatus PaymentStatus);
