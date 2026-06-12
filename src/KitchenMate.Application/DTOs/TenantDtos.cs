namespace KitchenMate.Application.DTOs;

public record RegisterTenantRequest(
    string RestaurantName,
    string Slug,
    string AdminEmail,
    string AdminPassword,
    string AdminFullName);

public record TenantDto(Guid Id, string Name, string Slug, bool IsActive);
