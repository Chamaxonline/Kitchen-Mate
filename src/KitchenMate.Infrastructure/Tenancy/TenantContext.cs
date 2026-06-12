using System.Security.Claims;
using KitchenMate.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace KitchenMate.Infrastructure.Tenancy;

public class TenantContext(IHttpContextAccessor httpContextAccessor) : ITenantContext
{
    public Guid? TenantId
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.User?.FindFirstValue("tenant_id");
            return value is not null && Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public bool HasTenant => TenantId.HasValue;
}
