using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace KitchenMate.Infrastructure.Identity;

public class AuthService(
    UserManager<ApplicationUser> userManager,
    JwtTokenGenerator tokenGenerator) : IAuthService
{
    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await userManager.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email == request.Email, ct)
            ?? throw new BusinessRuleException("Invalid email or password.");

        if (!await userManager.CheckPasswordAsync(user, request.Password))
            throw new BusinessRuleException("Invalid email or password.");

        if (!user.Tenant.IsActive)
            throw new BusinessRuleException("This restaurant account is inactive.");

        var roles = await userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? throw new BusinessRuleException("User has no assigned role.");

        var (token, expires) = tokenGenerator.Generate(user, role, user.Tenant);
        return new AuthResponse(
            token,
            user.Id,
            user.Email ?? string.Empty,
            user.FullName,
            role,
            expires,
            user.Tenant.Id,
            user.Tenant.Name,
            user.Tenant.Slug);
    }

    public async Task<UserDto?> GetCurrentUserAsync(string userId, CancellationToken ct = default)
    {
        var user = await userManager.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return null;

        var roles = await userManager.GetRolesAsync(user);
        return new UserDto(
            user.Id,
            user.Email ?? string.Empty,
            user.FullName,
            roles.FirstOrDefault() ?? string.Empty,
            user.Tenant.Id,
            user.Tenant.Name,
            user.Tenant.Slug);
    }
}
