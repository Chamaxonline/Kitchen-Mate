using KitchenMate.Application.DTOs;

namespace KitchenMate.Application.Interfaces;

public interface IGuestOrderService
{
    Task<GuestMenuDto> GetMenuAsync(string tenantSlug, string tableNumber, CancellationToken ct = default);
    Task<GuestOrderDto?> GetUnpaidOrderAsync(string tenantSlug, string tableNumber, CancellationToken ct = default);
    Task<GuestOrderDto> SyncUnpaidOrderAsync(string tenantSlug, string tableNumber, SyncGuestOrderRequest request, CancellationToken ct = default);
    Task<GuestPaymentIntentDto> CreatePaymentAsync(string tenantSlug, string tableNumber, CancellationToken ct = default);
    Task<GuestOrderDto> ConfirmPaymentAsync(string tenantSlug, string tableNumber, ConfirmGuestPaymentRequest request, CancellationToken ct = default);
    Task<GuestOrderDto> DemoPayAsync(string tenantSlug, string tableNumber, CancellationToken ct = default);
}
