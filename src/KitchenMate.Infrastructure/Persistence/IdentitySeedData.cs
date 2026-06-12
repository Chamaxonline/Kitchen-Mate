using KitchenMate.Domain.Constants;
using KitchenMate.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace KitchenMate.Infrastructure.Persistence;

public static class IdentitySeedData
{
    private static readonly (string Email, string Password, string FullName, string Role)[] DemoUsers =
    [
        ("waiter@kitchen.local", "Password123!", "Demo Waiter", Roles.Waiter),
        ("kitchen@kitchen.local", "Password123!", "Demo Kitchen", Roles.Kitchen),
        ("manager@kitchen.local", "Password123!", "Demo Manager", Roles.Manager),
        ("admin@kitchen.local", "Password123!", "Demo Admin", Roles.Admin)
    ];

    public static async Task InitializeAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        foreach (var role in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        foreach (var demo in DemoUsers)
        {
            if (await userManager.FindByEmailAsync(demo.Email) is not null)
                continue;

            var user = new ApplicationUser
            {
                UserName = demo.Email,
                Email = demo.Email,
                FullName = demo.FullName,
                EmailConfirmed = true
            };

            await userManager.CreateAsync(user, demo.Password);
            await userManager.AddToRoleAsync(user, demo.Role);
        }
    }
}
