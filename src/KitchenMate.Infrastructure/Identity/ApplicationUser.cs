using KitchenMate.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace KitchenMate.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public Guid TenantId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public Tenant Tenant { get; set; } = null!;
}
