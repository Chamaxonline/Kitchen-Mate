namespace KitchenMate.Application.DTOs;

public record LoginRequest(string Email, string Password);

public record AuthResponse(
    string Token,
    string UserId,
    string Email,
    string FullName,
    string Role,
    DateTime ExpiresAt,
    Guid TenantId,
    string TenantName,
    string TenantSlug);

public record UserDto(
    string Id,
    string Email,
    string FullName,
    string Role,
    Guid TenantId,
    string TenantName,
    string TenantSlug);

public record CreateUserRequest(string Email, string Password, string FullName, string Role);
