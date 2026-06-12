using System.Security.Claims;
using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Interfaces;
using KitchenMate.Domain.Constants;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace KitchenMate.Infrastructure.Identity;

public class UserService(
    UserManager<ApplicationUser> userManager,
    ITenantContext tenantContext,
    IHttpContextAccessor httpContextAccessor) : IUserService
{
    public async Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken ct = default)
    {
        var tenantId = RequireTenantId();
        var users = await userManager.Users
            .Include(u => u.Tenant)
            .Where(u => u.TenantId == tenantId)
            .OrderBy(u => u.FullName)
            .ToListAsync(ct);

        var result = new List<UserDto>();
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            result.Add(new UserDto(
                user.Id,
                user.Email ?? string.Empty,
                user.FullName,
                roles.FirstOrDefault() ?? string.Empty,
                user.Tenant.Id,
                user.Tenant.Name,
                user.Tenant.Slug));
        }

        return result;
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        if (!Roles.All.Contains(request.Role))
            throw new BusinessRuleException($"Invalid role. Allowed: {string.Join(", ", Roles.All)}");

        var currentRole = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Role);
        ValidateRoleAssignment(currentRole, request.Role);

        var tenantId = RequireTenantId();

        var user = new ApplicationUser
        {
            UserName = request.Email.Trim().ToLowerInvariant(),
            Email = request.Email.Trim().ToLowerInvariant(),
            FullName = request.FullName.Trim(),
            EmailConfirmed = true,
            TenantId = tenantId
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new BusinessRuleException(string.Join("; ", result.Errors.Select(e => e.Description)));

        await userManager.AddToRoleAsync(user, request.Role);

        var tenant = await userManager.Users
            .Include(u => u.Tenant)
            .Where(u => u.Id == user.Id)
            .Select(u => u.Tenant)
            .FirstAsync(ct);

        return new UserDto(
            user.Id,
            user.Email ?? string.Empty,
            user.FullName,
            request.Role,
            tenant.Id,
            tenant.Name,
            tenant.Slug);
    }

    private static void ValidateRoleAssignment(string? currentRole, string newRole)
    {
        if (currentRole == Roles.Admin)
            return;

        if (currentRole == Roles.Manager && newRole is Roles.Waiter or Roles.Kitchen)
            return;

        if (currentRole == Roles.Manager)
            throw new BusinessRuleException("Managers can only invite Waiter and Kitchen staff.");

        throw new BusinessRuleException("You do not have permission to invite users.");
    }

    private Guid RequireTenantId() =>
        tenantContext.TenantId ?? throw new BusinessRuleException("Tenant context is required.");
}
