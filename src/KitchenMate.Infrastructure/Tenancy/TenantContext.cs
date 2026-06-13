using System.Security.Claims;
using KitchenMate.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace KitchenMate.Infrastructure.Tenancy;

public static class TenantContextKeys
{
    public const string TenantId = "TenantId";
}

public class TenantContext(IHttpContextAccessor httpContextAccessor) : ITenantContext
{
    public Guid? TenantId
    {
        get
        {
            if (httpContextAccessor.HttpContext?.Items[TenantContextKeys.TenantId] is Guid scopedId)
                return scopedId;

            var value = httpContextAccessor.HttpContext?.User?.FindFirstValue("tenant_id");
            return value is not null && Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public bool HasTenant => TenantId.HasValue;

    public static void SetTenantId(HttpContext httpContext, Guid tenantId) =>
        httpContext.Items[TenantContextKeys.TenantId] = tenantId;
}
