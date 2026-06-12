using KitchenMate.Application.DTOs;

namespace KitchenMate.Application.Interfaces;

public interface ITenantService
{
    Task<AuthResponse> RegisterAsync(RegisterTenantRequest request, CancellationToken ct = default);
    Task<TenantDto?> GetCurrentTenantAsync(CancellationToken ct = default);
}
