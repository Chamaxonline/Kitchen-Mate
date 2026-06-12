using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Interfaces;
using KitchenMate.Domain.Constants;
using KitchenMate.Domain.Entities;
using KitchenMate.Infrastructure.Identity;
using KitchenMate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace KitchenMate.Infrastructure.Tenancy;

public class TenantService(
    ApplicationDbContext db,
    UserManager<ApplicationUser> userManager,
    JwtTokenGenerator tokenGenerator,
    ITenantContext tenantContext) : ITenantService
{
    public async Task<AuthResponse> RegisterAsync(RegisterTenantRequest request, CancellationToken ct = default)
    {
        var name = request.RestaurantName.Trim();
        var slug = TenantSlugNormalizer.Normalize(request.Slug);
        var email = request.AdminEmail.Trim().ToLowerInvariant();
        var fullName = request.AdminFullName.Trim();

        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleException("Restaurant name is required.");

        if (!TenantSlugNormalizer.IsValid(slug))
            throw new BusinessRuleException("Slug must be 3–50 characters: lowercase letters, numbers, and hyphens only.");

        if (await db.Tenants.AnyAsync(t => t.Slug == slug, ct))
            throw new BusinessRuleException("This restaurant URL is already taken. Choose a different slug.");

        if (await userManager.Users.AnyAsync(u => u.Email == email, ct))
            throw new BusinessRuleException("An account with this email already exists.");

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        try
        {
            var tenant = new Tenant
            {
                Name = name,
                Slug = slug,
                IsActive = true
            };

            db.Tenants.Add(tenant);
            await db.SaveChangesAsync(ct);

            var admin = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = fullName,
                EmailConfirmed = true,
                TenantId = tenant.Id
            };

            var createResult = await userManager.CreateAsync(admin, request.AdminPassword);
            if (!createResult.Succeeded)
                throw new BusinessRuleException(string.Join("; ", createResult.Errors.Select(e => e.Description)));

            await userManager.AddToRoleAsync(admin, Roles.Admin);
            await TenantSeedHelper.SeedMenuAndTablesAsync(db, tenant.Id, ct);

            await transaction.CommitAsync(ct);

            var (token, expires) = tokenGenerator.Generate(admin, Roles.Admin, tenant);
            return new AuthResponse(
                token,
                admin.Id,
                admin.Email ?? string.Empty,
                admin.FullName,
                Roles.Admin,
                expires,
                tenant.Id,
                tenant.Name,
                tenant.Slug);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<TenantDto?> GetCurrentTenantAsync(CancellationToken ct = default)
    {
        if (tenantContext.TenantId is not Guid tenantId)
            return null;

        var tenant = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId, ct);
        return tenant is null ? null : new TenantDto(tenant.Id, tenant.Name, tenant.Slug, tenant.IsActive);
    }
}
