using Microsoft.AspNetCore.Identity;

namespace KitchenMate.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
}
